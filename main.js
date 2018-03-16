fetch('emotions.json')
  .then(response => response.text())
  .then(text => render(text) )

function render(emotions) {
	console.log(emotions);
}

