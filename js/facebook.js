// select the target node
let target = document.getElementsByTagName('title')[0];

// create an observer instance
let observer = new MutationObserver((mutations) => {
  target.innerHTML = 'Facebook';
});

// configuration of the observer:
let config = { attributes: true, childList: true, characterData: true };

// pass in the target node, as well as the observer options
observer.observe(target, config);

console.log('Init Ok');
