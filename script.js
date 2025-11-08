// 🌍 ZWL Currency Converter by Lisa Dube
// API Key: baf8990da4b95a474a16a2ad
// Hosted on GitHub Pages

const form = document.querySelector("form");
const resultDiv = document.querySelector("#result");
const amountInput = document.querySelector("#amount");
const fromSelect = document.querySelector("#from");
const toSelect = document.querySelector("#to");
const chartCanvas = document.getElementById("chart");

let chartInstance;

// ✅ Fetch live exchange rate
async function fetchRate(from, to) {
  try {
    const apiUrl = `https://v6.exchangerate-api.com/v6/baf8990da4b95a474a16a2ad/latest/${from}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.result !== "success" || !data.conversion_rates[to]) {
      throw new Error("Invalid API response");
    }
    return data.conversion_rates[to];
  } catch (error) {
    console.error("Error fetching rate:", error);
    return null;
  }
}

// 📊 Generate mock 7-day trend
async function fetchTrendData(from, to) {
  const baseRate = await fetchRate(from, to);
  if (!baseRate) return [];
  return Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    rate: (baseRate * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2),
  }));
}

// 🧮 Handle conversion
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const from = fromSelect.value;
  const to = toSelect.value;
  const amount = parseFloat(amountInput.value);

  if (!amount || amount <= 0) {
    resultDiv.textContent = "Enter a valid amount.";
    resultDiv.style.color = "#e74c3c";
    return;
  }

  resultDiv.textContent = "Fetching live rates...";
  resultDiv.style.color = "#666";

  const rate = await fetchRate(from, to);
  if (!rate) {
    resultDiv.innerHTML = "❌ Error fetching rates. Please try again later.";
    resultDiv.style.color = "#e74c3c";
    return;
  }

  const converted = (amount * rate).toFixed(2);
  resultDiv.innerHTML = `
    ✅ ${amount} ${from} = <strong>${converted} ${to}</strong><br>
    <small>1 ${from} = ${rate.toFixed(2)} ${to}</small>
  `;
  resultDiv.style.color = "#111";

  const trendData = await fetchTrendData(from, to);
  renderChart(trendData, from, to);
});

// 📈 Chart rendering
function renderChart(trendData, from, to) {
  if (!trendData.length) return;
  const labels = trendData.map((d) => d.day);
  const values = trendData.map((d) => d.rate);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${from} → ${to} (7-Day Trend)`,
          data: values,
          borderColor: "#ff6b00",
          borderWidth: 2,
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: false } },
    },
  });
}

// ✅ Confirm script loaded
console.log("✅ ZWL Currency Converter loaded successfully");
