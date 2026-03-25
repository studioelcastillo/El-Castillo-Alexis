async function testEndpoint() {
  const identifier = "1144063158";
  
  console.log(`Testing lookup for ${identifier}...`);
  try {
    const res = await fetch(`http://localhost:3000/__local/login-lookup?identifier=${identifier}`);
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", data);
  } catch (e) {
    console.error("Fetch error:", e);
  }

  try {
    const res = await fetch(`https://pruebas.livstre.com/__local/login-lookup?identifier=${identifier}`);
    console.log("Status (prod):", res.status);
    const data = await res.json();
    console.log("Data (prod):", data);
  } catch (e) {
    console.error("Fetch error (prod):", e);
  }
}

testEndpoint();
