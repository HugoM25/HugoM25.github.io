
//Used to split the word Engineering Student into span letters 
const enhance = id => {
    const element = document.getElementById(id),
          text = element.innerText.split('');
    element.innerText = '';

    text.forEach(letter => {
        const span = document.createElement('span');
        if (letter === " "){
            span.className = 'letter-start';
        }
        else {
            span.className = 'letter';
        }
        
        span.innerText = letter;
        element.appendChild(span);  
    });
}

enhance('word-explosive');
