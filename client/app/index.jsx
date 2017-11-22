import React from 'react';
import {render} from 'react-dom';
import AwesomeComponent from './AwesomeComponent.jsx';
import Root from './Root.jsx';

var main = render(<Root/>, document.getElementById('root'));

document.onkeypress = function (e) {
    main.kbEvent(e.keyCode);
};

//monkey patching the keydown event
document.defaultKeyDown = document.onkeydown;
document.onkeydown = function (e) {
    if (e.keyCode>=37 && e.keyCode<=40) {
        main.kbEvent(e.keyCode);
    } else {
        document.defaultKeyDown(e);
    }
};
