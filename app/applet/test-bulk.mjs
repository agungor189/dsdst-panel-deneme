import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/products/bulk-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-frontend-request': 'true'
      },
      body: JSON.stringify({
        updates: [{ id: 'test-id', newSalePrice: 1000 }],
        settings: { exchangeRate: 30, bufferPercentage: 20, profitPercentage: 50 }
      })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}

test();
