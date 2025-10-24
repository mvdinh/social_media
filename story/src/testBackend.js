import { time } from "console";

const TEST_URL = "http://localhost:5000/post";

async function testBackend() {
  const payload = {
    filePath: "D:\\github\\social_media\\social_media\\story\\src\\test\\pic1.png",
    owner: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    timestamp: Date.now(),
  };

  try {
    const res = await fetch(TEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Response from backend:", data);
  } catch (err) {
    console.error("Error testing backend:", err);
  }
}

testBackend();
