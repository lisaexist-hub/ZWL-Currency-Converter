console.log("✅ ZWL Converter Script Loaded");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("converter-form");
  const resultDiv = document.getElementById("result");
  const amountInput = document.getElementById("amount");
  const fromSelect = document.getElementById("from");
  const toSelect = document.getElementById("to");
  const chartCanvas = document.getElementById("chart");
  let chartInstance;

  if (!form || !resultDiv || !amountInput || !fromSelect || !toSelect) {
    alert("❌ Error: One or more required elements not found in the DOM.");
    console.error("Missing DOM element", { form, resultDiv, amountInput, fromSelect, toSelect });
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Extra debug: confirm handler is active
    console.log("➡️ Convert clicked!");

    const amount = parseFloat(amountInput.value);
    const from = fromSelect.value;
    const to = toSelect.value;

    if (isNaN(amount) || amount <= 0) {
      resultDiv.textContent = "⚠️ Enter a valid amount.";
      resultDiv.style.color = "#e74c3c";
      return;
    }

    resultDiv.textContent = "Fetching live rate...";
    resultDiv.style.color = "#666";

    try {
      const apiUrl = `https://v6.exchangerate-api.com/v6/baf8990da4b95a474a16a2ad/latest/${from}`;
      console.log("📡 Fetching:", apiUrl);
      const res = await fetch(apiUrl);

      if (!res.ok) {
        throw new Error(`Network error: ${res.status}`);
      }

      const data = await res.json();
      console.log("API Response:", data);

      if (data.result !== "success") {
        throw new Error(data["error-type"] || "Bad API response");
      }

      const rate = data.conversion_rates[to];
      if (!rate) {
        throw new Error(`No rate available for ${from} to ${to}`);
      }

      const converted = (amount * rate).toFixed(2);

      resultDiv.innerHTML = `
        ✅ ${amount} ${from} = <strong>${converted} ${to}</strong><br>
        <small>1 ${from} = ${rate.toFixed(2)} ${to}</small><br>
        <small>Updated: ${new Date().toLocaleString()}</small>
      `;
      resultDiv.style.color = "#111";

      // generate trend
      const trend = Array.from({ length: 7 }, (_, i) => ({
        label: `Day ${i + 1}`,
        value: (rate * (1 + (Math.random() - 0.5) * 0.04)).toFixed(2),
      }));

      // chart.js: destroy old, create new
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(chartCanvas, {
        type: "line",
        data: {
          labels: trend.map((t) => t.label),
          datasets: [
            {
              label: `${from} → ${to} (7-day trend)`,
              data: trend.map((t) => t.value),
              borderColor: "#ff6b00",
              borderWidth: 2,
              fill: false,
              tension: 0.3,
            },
          ],
        },
        options: { responsive: true, plugins: { legend: { display: true } } },
      });
    } catch (err) {
      console.error("❌ Error:", err);
      resultDiv.textContent = "❌ Could not fetch live rates. Try again later.<br>" +
                              (err.message ? `Error: ${err.message}` : "");
      resultDiv.style.color = "#e74c3c";
    }
  });
});
