// Elemente HTML
const form = document.getElementById("readingForm");
const sessionsList = document.getElementById("sessionsList");
const ctx = document.getElementById("readingChart").getContext("2d");

let sessions = [];

// Încarcă datele din LocalStorage la start
if (localStorage.getItem("sessions")) {
  sessions = JSON.parse(localStorage.getItem("sessions"));
}

// Inițializează graficul
let chart;
function initChart(dailyData) {
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(dailyData),
      datasets: [
        {
          label: 'Minute citite',
          data: Object.values(dailyData).map(d => d.minutes),
          borderColor: '#ff3385',
          backgroundColor: '#ff99cc',
          tension: 0.3,
          fill: false
        },
        {
          label: 'Pagini citite',
          data: Object.values(dailyData).map(d => d.pages),
          borderColor: '#ff66b2',
          backgroundColor: '#ffccdd',
          tension: 0.3,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        datalabels: {
          font: { weight: 'bold', size: 12 },
          anchor: 'end',
          align: 'top',
          formatter: function(value) {
            return value;
          },
          color: function(context) {
            return context.dataset.borderColor; // aceeași culoare ca linia
          }
        }
      },
      scales: { y: { beginAtZero: true } }
    },
    plugins: [ChartDataLabels] // activează plugin-ul
  });
}

// Funcție pentru a cumula datele pe zi
function getDailyData() {
  const dailyData = {};
  sessions.forEach(s => {
    if (!dailyData[s.date]) {
      dailyData[s.date] = { minutes: 0, pages: 0 };
    }
    dailyData[s.date].minutes += s.minutes;
    dailyData[s.date].pages += s.pages;
  });
  return dailyData;
}

// Actualizează lista și graficul
function updateListAndChart() {
  // Listează sesiunile individuale
  sessionsList.innerHTML = "";
  sessions.forEach((s, index) => {
    const div = document.createElement("div");
    div.textContent = `${s.date}: ${s.minutes} minute, ${s.pages} pagini`;

    // Buton de ștergere
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Șterge";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.style.padding = "2px 6px";
    deleteBtn.style.border = "none";
    deleteBtn.style.borderRadius = "5px";
    deleteBtn.style.backgroundColor = "#ff3385";
    deleteBtn.style.color = "#fff";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.onclick = () => {
      sessions.splice(index, 1); // șterge sesiunea
      localStorage.setItem("sessions", JSON.stringify(sessions));
      updateListAndChart();
    };

    div.appendChild(deleteBtn);
    sessionsList.appendChild(div);
  });

  // Graficul pe zi
  const dailyData = getDailyData();
  if (chart) chart.destroy();
  initChart(dailyData);
}

// La submit adaugă sesiune
form.addEventListener("submit", function(e) {
  e.preventDefault();

  const minutes = Number(document.getElementById("minutes").value);
  const pages = Number(document.getElementById("pages").value);
  const today = new Date().toLocaleDateString();

  const session = {
    minutes,
    pages,
    date: today
  };

  sessions.push(session);
  localStorage.setItem("sessions", JSON.stringify(sessions));

  updateListAndChart();
  form.reset();
});

// Inițializează lista și graficul la start
updateListAndChart();
