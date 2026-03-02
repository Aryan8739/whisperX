const ADMIN_BACKEND_URL = "http://localhost:3001";

document.getElementById("adminLoginBtn").addEventListener("click", async () => {
    const password = document.getElementById("adminPassword").value.trim();

    if (!password) {
        alert("Enter password");
        return;
    }

    try {
        const res = await fetch(`${ADMIN_BACKEND_URL}/api/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });

        const data = await res.json();

        if (!data.token) {
            alert("Wrong password");
            return;
        }

        localStorage.setItem("admin_token", data.token);
        window.location.href = "/admin-dashboard.html";

    } catch (e) {
        console.error("Login error:", e);
    }
});
