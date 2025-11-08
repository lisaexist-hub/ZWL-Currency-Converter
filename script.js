// 🌍 ZWL Currency Converter by Lisa Dube
// Live on: https://lisaexist-hub.github.io/ZWL-Currency-Converter/
// API: ExchangeRate-API (Free Plan) - HTTPS + CORS Safe

const form = document.querySelector("form");
const resultDiv = document.querySelector("#result");
const amountInput = document.querySelector("#amount");
const fromSelect = document.querySelector("#from");
const toSelect = document.querySelector("#to");
const chartCanvas = document.getElementById("chart");

let chartInstance;

// ✅ Fetch real-time exchange rate using your API key
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

// 📊 Create mock trend data for 7 days
async function fetchTrendData(from, to) {
  const baseRate = await fetchRate(from, to);
  if (!baseRate) return [];

  // Generate small random variations around the live rate
  return Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    rate: (baseRate * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2),
  }));
}

// 🧮 Handle conversion on form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const from = fromSelect.value;
  const to = toSelect.value;
  const amount = parseFloat(amountInput.value);

  resultDiv.innerHTML = "Fetching live rates...";
  resultDiv.style.color = "#666";

  const rate = await fetchRate(from, to);
  if (!rate) {
    resultDiv.innerHTML = "❌ Error fetching rates. Please try again.";
    resultDiv.style.color = "#e74c3c";
    return;
  }

  const converted = (amount * rate).toFixed(2);
  resultDiv.innerHTML = `
    ✅ ${amount} ${from} = <strong>${converted} ${to}</strong><br>
    <small>Live rate: 1 ${from} = ${rate.toFixed(2)} ${to}</small>
  `;
  resultDiv.style.color = "#111";

  // Draw 7-day rate trend chart
  const trendData = await fetchTrendData(from, to);
  renderChart(trendData, from, to);
});

// 📈 Draw chart
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
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: { beginAtZero: false },
      },
    },
  });
}
