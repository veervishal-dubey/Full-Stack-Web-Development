// file name js/rain.js  use kiya tha vs code pe -> rain.js display hua udhar 

const rainContainer = document.createElement("div");
rainContainer.classList.add("rain");
document.body.appendChild(rainContainer);

const numberOfDrops = 120;
for(let i=0;i<numberOfDrops;i++){
  const drop=document.createElement("div");
  drop.classList.add("rain-drop");
  drop.style.left = Math.random()*100+"vw";
  drop.style.animationDuration = (Math.random()*1+0.8)+"s";
  drop.style.animationDelay = Math.random()*5+"s";
  rainContainer.appendChild(drop);
}
