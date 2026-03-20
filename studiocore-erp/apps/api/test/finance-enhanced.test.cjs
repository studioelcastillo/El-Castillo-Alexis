const assert = require('node:assert/strict');
const test = require('node:test');
const { closeTestContext, createTestContext } = require('./support/test-app.cjs');

test('Finance module: listing and transfers', async () => {
  const context = await createTestContext();

  try {
    // 1. Create two accounts
    const acc1Response = await context.request
      .post('/api/v1/finance/accounts')
      .set('Authorization', context.authHeader)
      .send({
        name: 'Caja Test 1',
        type: 'cash',
        currency: 'COP',
      })
      .expect(201);

    const acc2Response = await context.request
      .post('/api/v1/finance/accounts')
      .set('Authorization', context.authHeader)
      .send({
        name: 'Caja Test 2',
        type: 'cash',
        currency: 'COP',
      })
      .expect(201);

    const id1 = acc1Response.body.data.id;
    const id2 = acc2Response.body.data.id;

    // 2. Add initial balance to acc1
    await context.request
      .post('/api/v1/finance/transactions')
      .set('Authorization', context.authHeader)
      .send({
        accountId: id1,
        type: 'income',
        amount: '100000',
        description: 'Carga inicial',
      })
      .expect(201);

    // 3. Perform transfer from acc1 to acc2
    await context.request
      .post('/api/v1/finance/transfers')
      .set('Authorization', context.authHeader)
      .send({
        sourceAccountId: id1,
        destinationAccountId: id2,
        amount: '40000',
        description: 'Pago interno',
      })
      .expect(201);

    // 4. Verify balances
    const view1 = await context.request
      .get(`/api/v1/finance/accounts/${id1}`)
      .set('Authorization', context.authHeader)
      .expect(200);
    
    const view2 = await context.request
      .get(`/api/v1/finance/accounts/${id2}`)
      .set('Authorization', context.authHeader)
      .expect(200);

    assert.equal(Number(view1.body.data.balance), 60000);
    assert.equal(Number(view2.body.data.balance), 40000);

    // 5. List transactions and verify
    const txList = await context.request
      .get('/api/v1/finance/transactions')
      .set('Authorization', context.authHeader)
      .expect(200);

    // Should have 3 transactions (1 income, 2 transfer-related)
    assert.ok(txList.body.items.length >= 3);
    const transferTx = txList.body.items.find(t => t.description.includes('Pago interno'));
    assert.ok(transferTx);

  } finally {
    await closeTestContext(context);
  }
});
