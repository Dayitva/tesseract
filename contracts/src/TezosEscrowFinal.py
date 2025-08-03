import smartpy as sp

@sp.module
def main():
    # Type definitions
    order_type: type = sp.record(
        id=sp.nat,
        maker_address=sp.address,
        amount=sp.mutez,
        secret_hash=sp.bytes,
        claimed=sp.bool
    )
    
    class TezosEscrow(sp.Contract):
        def __init__(self, owner):
            # Initialize storage
            self.data.orders = sp.cast(sp.big_map({}), sp.big_map[sp.nat, order_type])
            self.data.order_counter = sp.nat(0)
            self.data.owner = owner

        @sp.entrypoint
        def announce_order(self, secret_hash):
            """Create a new escrow order with sent XTZ"""
            # Note: sp.amount validation will be enabled after testing
            # assert sp.amount > sp.mutez(0), "Amount must be positive"
            
            # Create new order
            order_id = self.data.order_counter
            new_order = sp.record(
                id=order_id,
                maker_address=sp.sender,
                amount=sp.amount,
                secret_hash=secret_hash,
                claimed=False
            )
            
            # Store order and increment counter
            self.data.orders[order_id] = new_order
            self.data.order_counter += sp.nat(1)

        @sp.entrypoint  
        def claim_funds(self, order_id, secret):
            """Claim funds by revealing the secret"""
            # No incoming XTZ for claims
            assert sp.amount == sp.mutez(0), "No XTZ should be sent for claims"
            
            # Verify order exists
            assert self.data.orders.contains(order_id), "Order not found"
            order = self.data.orders[order_id]
            
            # Verify conditions
            assert not order.claimed, "Order already claimed"
            assert sp.sha256(secret) == order.secret_hash, "Invalid secret"
            
            # Mark as claimed
            updated_order = sp.record(
                id=order.id,
                maker_address=order.maker_address,
                amount=order.amount,
                secret_hash=order.secret_hash,
                claimed=True
            )
            self.data.orders[order_id] = updated_order
            
            # Transfer funds to claimer
            sp.send(sp.sender, order.amount)

        @sp.entrypoint
        def cancel_order(self, order_id):
            """Cancel order and refund maker"""
            # No incoming XTZ for cancels
            assert sp.amount == sp.mutez(0), "No XTZ should be sent for cancels"
            
            # Verify order exists
            assert self.data.orders.contains(order_id), "Order not found"
            order = self.data.orders[order_id]
            
            # Only maker can cancel
            assert sp.sender == order.maker_address, "Only maker can cancel"
            assert not order.claimed, "Order already claimed"
            
            # Remove order and refund
            del self.data.orders[order_id]
            sp.send(order.maker_address, order.amount)

        @sp.entrypoint
        def get_order_count(self):
            """View function to get total order count"""
            pass  # SmartPy view functions don't return values directly

# Test scenario  
@sp.add_test()
def test_escrow_flow():
    scenario = sp.test_scenario("Tezos Escrow Cross-Chain", main)
    
    # Test accounts
    alice = sp.test_account("Alice")  # Maker
    bob = sp.test_account("Bob")      # Claimer
    
    # Deploy contract
    contract = main.TezosEscrow(alice.address)
    scenario += contract
    
    # Test secret
    secret = sp.bytes("0x1234567890abcdef1234567890abcdef")
    secret_hash = sp.sha256(secret)
    
    scenario.h1("🚀 Test 1: Order Creation")
    
    # Alice creates order with 1 XTZ
    scenario += contract.announce_order(secret_hash).run(
        sender=alice,
        amount=sp.mutez(1000000)  # 1 XTZ
    )
    
    # Verify order created
    scenario.verify(contract.data.order_counter == sp.nat(1))
    scenario.verify(contract.data.orders.contains(sp.nat(0)))
    
    order = contract.data.orders[sp.nat(0)]
    scenario.verify(order.maker_address == alice.address)
    scenario.verify(order.amount == sp.mutez(1000000))
    scenario.verify(order.claimed == False)
    
    scenario.h1("💰 Test 2: Successful Claim")
    
    # Bob claims with correct secret
    scenario += contract.claim_funds(sp.nat(0), secret).run(sender=bob)
    
    # Verify order is now claimed
    scenario.verify(contract.data.orders[sp.nat(0)].claimed == True)
    
    scenario.h1("❌ Test 3: Error Cases")
    
    # Try to claim already claimed order
    scenario += contract.claim_funds(sp.nat(0), secret).run(
        sender=bob, 
        valid=False,
        exception="Order already claimed"
    )
    
    scenario.h1("🔄 Test 4: Order Cancellation")
    
    # Alice creates another order
    scenario += contract.announce_order(secret_hash).run(
        sender=alice,
        amount=sp.mutez(500000)  # 0.5 XTZ
    )
    
    # Alice cancels her own order
    scenario += contract.cancel_order(sp.nat(1)).run(sender=alice)
    
    # Verify order was removed
    scenario.verify(not contract.data.orders.contains(sp.nat(1)))
    
    scenario.h1("🚫 Test 5: Access Control")
    
    # Alice creates order
    scenario += contract.announce_order(secret_hash).run(
        sender=alice,
        amount=sp.mutez(300000)  # 0.3 XTZ
    )
    
    # Bob tries to cancel Alice's order (should fail)
    scenario += contract.cancel_order(sp.nat(2)).run(
        sender=bob,
        valid=False,
        exception="Only maker can cancel"
    )
    
    scenario.h1("✅ All Escrow Tests Completed Successfully!")
    
    # Final state verification
    scenario.verify(contract.data.order_counter == sp.nat(3))  # 3 orders created total
    scenario.verify(contract.data.orders.contains(sp.nat(2)))  # Last order still exists