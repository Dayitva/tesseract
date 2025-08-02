// Tezos Michelson contract for cross-chain atomic swap escrow
// This contract implements the same hashlock and timelock mechanism as the EVM contracts

type order_metadata =
  {
    id: nat;
    maker_address: address;
    escrow_address: address;
    amount: tez;
    secret_hash: bytes;
    expiration_timestamp: timestamp;
    revealed_secret: option<bytes>;
  }

type storage =
  {
    orders: (nat, order_metadata) big_map;
    order_counter: nat;
    owner: address;
  }

type parameter =
  | Announce_order of {
      src_amount: tez;
      min_dst_amount: nat;
      expiration_duration: nat;
      secret_hash: bytes;
    }
  | Fund_dst_escrow of {
      dst_amount: tez;
      expiration_duration: nat;
      secret_hash: bytes;
    }
  | Claim_funds of {
      order_id: nat;
      secret: bytes;
    }
  | Cancel_swap of {
      order_id: nat;
    }
  | Rescue_funds of {
      order_id: nat;
    }

// Hash function equivalent to Solidity keccak256
let keccak256_hash (data: bytes): bytes =
  Crypto.keccak256 data

// Check if secret matches hashlock
let check_hash (secret: bytes) (hash: bytes): bool =
  keccak256_hash secret = hash

// Validate time window for actions
let validate_time_window (current_time: timestamp) (expiration: timestamp): bool =
  current_time < expiration

// Announce order - create new escrow order
let announce_order (param: tez * nat * nat * bytes) (storage: storage): (list<operation>, storage) =
  let (src_amount, min_dst_amount, expiration_duration, secret_hash) = param in
  
  // Validate inputs
  if src_amount <= 0mutez then
    (failwith "Invalid amount": list<operation>, storage)
  else if min_dst_amount <= 0n then
    (failwith "Invalid min amount": list<operation>, storage)
  else if expiration_duration <= 0n then
    (failwith "Invalid expiration": list<operation>, storage)
  else if String.length (Bytes.to_string secret_hash) <> 32 then
    (failwith "Invalid secret hash length": list<operation>, storage)
  else
    let expiration_timestamp = Tezos.now + expiration_duration in
    let order_id = storage.order_counter in
    let new_order = {
      id = order_id;
      maker_address = Tezos.sender;
      escrow_address = Tezos.self_address;
      amount = src_amount;
      secret_hash = secret_hash;
      expiration_timestamp = expiration_timestamp;
      revealed_secret = None;
    } in
    let new_storage = {
      orders = Big_map.update order_id (Some new_order) storage.orders;
      order_counter = storage.order_counter + 1n;
      owner = storage.owner;
    } in
    (([]: list<operation>), new_storage)

// Fund destination escrow
let fund_dst_escrow (param: tez * nat * bytes) (storage: storage): (list<operation>, storage) =
  let (dst_amount, expiration_duration, secret_hash) = param in
  
  if dst_amount <= 0mutez then
    (failwith "Invalid amount": list<operation>, storage)
  else if expiration_duration <= 0n then
    (failwith "Invalid expiration": list<operation>, storage)
  else
    let expiration_timestamp = Tezos.now + expiration_duration in
    let order_id = storage.order_counter in
    let new_order = {
      id = order_id;
      maker_address = Tezos.sender;
      escrow_address = Tezos.self_address;
      amount = dst_amount;
      secret_hash = secret_hash;
      expiration_timestamp = expiration_timestamp;
      revealed_secret = None;
    } in
    let new_storage = {
      orders = Big_map.update order_id (Some new_order) storage.orders;
      order_counter = storage.order_counter + 1n;
      owner = storage.owner;
    } in
    (([]: list<operation>), new_storage)

// Claim funds using secret
let claim_funds (param: nat * bytes) (storage: storage): (list<operation>, storage) =
  let (order_id, secret) = param in
  
  match Big_map.find_opt order_id storage.orders with
  | None -> (failwith "Order not found": list<operation>, storage)
  | Some order ->
      if Option.is_some order.revealed_secret then
        (failwith "Order already claimed": list<operation>, storage)
      else if not (validate_time_window Tezos.now order.expiration_timestamp) then
        (failwith "Order expired": list<operation>, storage)
      else if not (check_hash secret order.secret_hash) then
        (failwith "Invalid secret": list<operation>, storage)
      else
        let updated_order = {
          order with
          revealed_secret = Some secret;
        } in
        let new_storage = {
          storage with
          orders = Big_map.update order_id (Some updated_order) storage.orders;
        } in
        let transfer_op = Operation.transfer_tokens 
          order.amount 
          (Tezos.sender) 
          (Tezos.self_address) 
          ([]: list<operation>) in
        ([transfer_op], new_storage)

// Cancel swap and return funds
let cancel_swap (param: nat) (storage: storage): (list<operation>, storage) =
  let order_id = param in
  
  match Big_map.find_opt order_id storage.orders with
  | None -> (failwith "Order not found": list<operation>, storage)
  | Some order ->
      if Option.is_some order.revealed_secret then
        (failwith "Order already claimed": list<operation>, storage)
      else if validate_time_window Tezos.now order.expiration_timestamp then
        (failwith "Order not expired yet": list<operation>, storage)
      else
        let transfer_op = Operation.transfer_tokens 
          order.amount 
          (order.maker_address) 
          (Tezos.self_address) 
          ([]: list<operation>) in
        (([transfer_op]: list<operation>), storage)

// Rescue funds (emergency function)
let rescue_funds (param: nat) (storage: storage): (list<operation>, storage) =
  let order_id = param in
  
  if Tezos.sender <> storage.owner then
    (failwith "Only owner can rescue funds": list<operation>, storage)
  else
    match Big_map.find_opt order_id storage.orders with
    | None -> (failwith "Order not found": list<operation>, storage)
    | Some order ->
        let transfer_op = Operation.transfer_tokens 
          order.amount 
          (storage.owner) 
          (Tezos.self_address) 
          ([]: list<operation>) in
        (([transfer_op]: list<operation>), storage)

// Main entry point
let main (param: parameter) (storage: storage): (list<operation>, storage) =
  match param with
  | Announce_order p -> announce_order (p.src_amount, p.min_dst_amount, p.expiration_duration, p.secret_hash) storage
  | Fund_dst_escrow p -> fund_dst_escrow (p.dst_amount, p.expiration_duration, p.secret_hash) storage
  | Claim_funds p -> claim_funds (p.order_id, p.secret) storage
  | Cancel_swap p -> cancel_swap p.order_id storage
  | Rescue_funds p -> rescue_funds p.order_id storage 