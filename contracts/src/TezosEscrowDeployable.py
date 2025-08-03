import smartpy as sp

@sp.module
def main():
    class TezosEscrow(sp.Contract):
        def __init__(self, owner):
            # Storage: orders mapping and counter
            self.data.orders = sp.cast(
                sp.big_map({}), 
                sp.big_map[sp.nat, sp.record(
                    maker_address=sp.address,
                    amount=sp.mutez,
                    secret_hash=sp.bytes,
                    claimed=sp.bool
                )]
            )
            self.data.order_counter = sp.nat(0)
            self.data.owner = owner

        @sp.entrypoint
        def announce_order(self, secret_hash):
            """Create escrow order with sent XTZ amount"""
            # Create order record
            order_id = self.data.order_counter
            
            # Store order
            self.data.orders[order_id] = sp.record(
                maker_address=sp.sender,
                amount=sp.amount,
                secret_hash=secret_hash,
                claimed=False
            )
            
            # Increment counter
            self.data.order_counter += sp.nat(1)

        @sp.entrypoint  
        def claim_funds(self, order_id, secret):
            """Claim escrowed funds with secret"""
            # Get order
            order = self.data.orders[order_id]
            
            # Verify secret and not claimed
            assert sp.sha256(secret) == order.secret_hash, "Invalid secret"
            assert not order.claimed, "Order already claimed"
            
            # Mark claimed
            order.claimed = True
            self.data.orders[order_id] = order
            
            # Transfer funds
            sp.send(sp.sender, order.amount)

        @sp.entrypoint
        def cancel_order(self, order_id):
            """Cancel order and refund maker"""
            # Get order
            order = self.data.orders[order_id]
            
            # Only maker can cancel
            assert sp.sender == order.maker_address, "Only maker can cancel"
            assert not order.claimed, "Order already claimed"
            
            # Remove and refund
            del self.data.orders[order_id]
            sp.send(order.maker_address, order.amount)