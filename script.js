const minutesInput = document.getElementById("minutes");
const pagesInput = document.getElementById("pages");
const addBtn = document.getElementById("add-session");
const sessionList = document.getElementById("session-list");
const totalSummary = document.getElementById("total-summary");
const toggleBtn = document.getElementById("toggle-sessions");

const periodButtons = document.querySelectorAll(".period-btn");
const periodValue = document.getElementById("period-value");
const prevPeriod = document.getElementById("prev-period");
const nextPeriod = document.getElementById("next-period");

let sessions = JSON.parse(localStorage.getItem("sessions")) || [];
let chart;
let currentPeriodType = "week";
let currentPeriodValue;

function populatePeriodValues() {
  periodValue.innerHTML = "";
  if (currentPeriodType === "week") {
    for (let i=1;i<=52;i++){
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = `Săptămâna ${i}`;
      periodValue.appendChild(opt);
    }
    currentPeriodValue = getWeekNumber(new Date());
  } else if (currentPeriodType === "month") {
    const months = ["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"];
    months.forEach((m,i)=>{
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = m;
      periodValue.appendChild(opt);
    });
    currentPeriodValue = new Date().getMonth();
  } else if (currentPeriodType === "year") {
    const year = new Date().getFullYear();
    for (let y=year-5;y<=year+5;y++){
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      periodValue.appendChild(opt);
    }
    currentPeriodValue = new Date().getFullYear();
  }
  periodValue.value = currentPeriodValue;
}

function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(),0,1);
  const pastDays = (date-firstDay)/86400000;
  return Math.ceil((pastDays + firstDay.getDay() + 1)/7);
}

// Set perioadă prin buton
periodButtons.forEach(btn=>{
  btn.addEventListener("click",()=>{
    periodButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentPeriodType = btn.dataset.type;
    populatePeriodValues();
    updateDisplay();
  });
});

// Adaugă sesiune
addBtn.addEventListener("click",()=>{
  const minutes = parseInt(minutesInput.value)||0;
  const pages = parseInt(pagesInput.value)||0;
  const today = new Date();
  const session = {
    id: Date.now(),
    date: today.toISOString().split("T")[0],
    week: getWeekNumber(today),
    month: today.getMonth(),
    year: today.getFullYear(),
    minutes,
    pages
  };
  sessions.push(session);
  localStorage.setItem("sessions", JSON.stringify(sessions));
  minutesInput.value="";
  pagesInput.value="";
  updateDisplay();
});

// Toggle sesiuni
toggleBtn.addEventListener("click",()=>{
  sessionList.classList.toggle("hidden");
});

// Șterge sesiune
function deleteSession(id){
  sessions = sessions.filter(s => s.id !== id);
  localStorage.setItem("sessions", JSON.stringify(sessions));
  updateDisplay();
}

// Navigare perioadă
prevPeriod.addEventListener("click",()=>{
  if(currentPeriodType==="week" && currentPeriodValue>1) currentPeriodValue--;
  else if(currentPeriodType==="month" && currentPeriodValue>0) currentPeriodValue--;
  else if(currentPeriodType==="year") currentPeriodValue--;
  periodValue.value=currentPeriodValue;
  updateDisplay();
});

nextPeriod.addEventListener("click",()=>{
  if(currentPeriodType==="week" && currentPeriodValue<52) currentPeriodValue++;
  else if(currentPeriodType==="month" && currentPeriodValue<11) currentPeriodValue++;
  else if(currentPeriodType==="year") currentPeriodValue++;
  periodValue.value=currentPeriodValue;
  updateDisplay();
});

periodValue.addEventListener("change",()=>{
  currentPeriodValue=periodValue.value;
  updateDisplay();
});

function updateDisplay(){
  displaySessions();
  updateTotals();
  updateChart();
}

function displaySessions(){
  sessionList.innerHTML="";
  sessions.forEach(s=>{
    const div=document.createElement("div");
    div.classList.add("session-item");
    div.innerHTML=`<span>${s.minutes} min | ${s.pages} pag.</span>
                   <button onclick="deleteSession(${s.id})">🗑️</button>`;
    sessionList.appendChild(div);
  });
}

function updateTotals(){
  let filtered = getPeriodSessions();
  const totalMin=filtered.reduce((a,b)=>a+b.minutes,0);
  const totalPages=filtered.reduce((a,b)=>a+b.pages,0);
  totalSummary.textContent=`Total: ${totalMin} minute | ${totalPages} pagini`;
}

function getPeriodSessions(){
  return sessions.filter(s=>{
    if(currentPeriodType==="week") return s.week==currentPeriodValue;
    if(currentPeriodType==="month") return s.month==currentPeriodValue && s.year==new Date().getFullYear();
    if(currentPeriodType==="year") return s.year==currentPeriodValue;
  });
}

function updateChart(){
  const filtered = getPeriodSessions();
  let labels=[], minutesData=[], pagesData=[];
  if(currentPeriodType==="week"){
    labels=["Lun","Mar","Mie","Joi","Vin","Sâm","Dum"];
    minutesData=Array(7).fill(0);
    pagesData=Array(7).fill(0);
    filtered.forEach(s=>{
      const d=new Date(s.date);
      let day=d.getDay()===0?6:d.getDay()-1;
      minutesData[day]+=s.minutes;
      pagesData[day]+=s.pages;
    });
  } else if(currentPeriodType==="month"){
    const daysInMonth = new Date(new Date().getFullYear(),parseInt(currentPeriodValue)+1,0).getDate();
    labels=Array.from({length:daysInMonth},(_,i)=>i+1);
    minutesData=Array(daysInMonth).fill(0);
    pagesData=Array(daysInMonth).fill(0);
    filtered.forEach(s=>{
      let day=new Date(s.date).getDate()-1;
      minutesData[day]+=s.minutes;
      pagesData[day]+=s.pages;
    });
  } else if(currentPeriodType==="year"){
    labels=["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Nov","Dec"];
    minutesData=Array(12).fill(0);
    pagesData=Array(12).fill(0);
    filtered.forEach(s=>{
      let month=new Date(s.date).getMonth();
      minutesData[month]+=s.minutes;
      pagesData[month]+=s.pages;
    });
  }

  if(chart) chart.destroy();
  chart=new Chart(document.getElementById("readingChart"),{
    type:"line",
    data:{
      labels:labels,
      datasets:[
        {label:"Minute citite",data:minutesData,borderColor:"#ff4fa3",backgroundColor:"#ffb6d5",tension:0.3},
        {label:"Pagini citite",data:pagesData,borderColor:"#ffa1c8",backgroundColor:"#ffe0ef",tension:0.3}
      ]
    },
    options:{responsive:true,scales:{y:{beginAtZero:true}}}
  });
}

populatePeriodValues();
updateDisplay();
