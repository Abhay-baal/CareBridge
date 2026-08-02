const BASE_URL = "http://localhost:5000/api";

const timestamp = Date.now();

const parentA = {
  fullName: "Test Parent A",
  email: `parenta${timestamp}@test.com`,
  password: "Test12345",
  phone: "9000000001",
  role: "parent",
};

const parentB = {
  fullName: "Test Parent B",
  email: `parentb${timestamp}@test.com`,
  password: "Test12345",
  phone: "9000000002",
  role: "parent",
};

const child = {
  fullName: "Test Child",
  email: `child${timestamp}@test.com`,
  password: "Test12345",
  phone: "9000000003",
  role: "child",
};

async function request(method, endpoint, body, token) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  console.log(`\n${method} ${endpoint}`);
  console.log(`STATUS: ${response.status}`);
  console.log(JSON.stringify(data, null, 2));

  return { response, data };
}

async function main() {
  console.log("========================================");
  console.log("CAREBRIDGE PARENT-CHILD API TEST");
  console.log("========================================");

  // 1. Register Parent A
  const registerA = await request(
    "POST",
    "/auth/register",
    parentA
  );

  const parentACode =
    registerA.data?.data?.connectionCode;

  // 2. Register Parent B
  const registerB = await request(
    "POST",
    "/auth/register",
    parentB
  );

  const parentBCode =
    registerB.data?.data?.connectionCode;

  // 3. Register Child using Parent A connection code
  const registerChild = await request(
    "POST",
    "/auth/register",
    {
      ...child,
      connectionCode: parentACode,
    }
  );

  // 4. Login Child
  const childLogin = await request(
    "POST",
    "/auth/login",
    {
      email: child.email,
      password: child.password,
    }
  );

  const childToken = childLogin.data?.token;

  if (!childToken) {
    throw new Error("Child login failed. No token received.");
  }

  // 5. Get parents before adding second parent
  await request(
    "GET",
    "/parent-child",
    null,
    childToken
  );

  // 6. Connect Parent B
  const connectB = await request(
    "POST",
    "/parent-child/connect",
    {
      connectionCode: parentBCode,
    },
    childToken
  );

  // 7. Get both parents
  const parentsResult = await request(
    "GET",
    "/parent-child",
    null,
    childToken
  );

  const relationships =
    parentsResult.data?.data || [];

  // 8. Try duplicate Parent B connection
  await request(
    "POST",
    "/parent-child/connect",
    {
      connectionCode: parentBCode,
    },
    childToken
  );

  // 9. Switch active parent to Parent B
  const parentBRelationship =
    relationships.find(
      (relationship) =>
        relationship.parent?.email === parentB.email
    );

  if (parentBRelationship) {
    await request(
      "PATCH",
      `/parent-child/active/${parentBRelationship._id}`,
      null,
      childToken
    );
  }

  // 10. Verify active parent
  await request(
    "GET",
    "/parent-child",
    null,
    childToken
  );

  // 11. Try unauthorized access without token
  await request(
    "GET",
    "/parent-child"
  );

  // 12. Remove Parent B
  if (parentBRelationship) {
    await request(
      "DELETE",
      `/parent-child/${parentBRelationship._id}`,
      null,
      childToken
    );
  }

  // 13. Final relationship check
  await request(
    "GET",
    "/parent-child",
    null,
    childToken
  );

  console.log("\n========================================");
  console.log("TEST COMPLETED");
  console.log("========================================");
}

main().catch((error) => {
  console.error("\nTEST FAILED:");
  console.error(error);
  process.exit(1);
});
