import React from 'react';
import ReactDOM from 'react-dom';
import Swipe from 'swipejs';

const DateTitle = (props) => <div><h1>{props.title.toUpperCase()}</h1></div>;

var fontStyle = {
    fontFamily: "\'Anonymous Pro\' !important",
    fontStyle: "normal",
    fontWeight: 700,
    fontSize: "3em",
    textAlign: "center"
};

var divStyle = Object.assign({
    position: "absolute",
    height: "5%",
    width: "100%",
    backgroundColor: "#eedb74",
    textAlign: "center",
    display: "inline"
}, fontStyle);

var arrowStyle = {
    position: "fixed",
    top: "0px",
    marginTop: "0.5em",
    textAlign: "center",
    paddingRight: "0.3em",
    paddingLeft: "0.3em"
};

var leftArrowStyle = Object.assign({
    "left": "0"
},arrowStyle);

var rightArrowStyle = Object.assign({
    "right": "0"
},arrowStyle);


class DateTitleBox extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        var that = this;
        this.swipe = Swipe(ReactDOM.findDOMNode(this), {
            startSlide: 0,
            draggable: true,
            autoRestart: false,
            continuous: true,
            disableScroll: true,
            stopPropagation: true,
            callback: (index, elem) => {
                var newIndex = 6-index;
                that.props.setIndex(newIndex);
            },
            transitionEnd: (index, element) => {}
        });
    }

    componentDidUpdate() {
        var newSlideIndex = 6 - this.props.batchIndex;
        if (this.swipe.getPos() != newSlideIndex) {
            this.swipe.slide(newSlideIndex, 2000);
        }
    }

    render() {
        var dateTitles = [];

        for (var i=6; i>=0; i--) {
            var timestamp = new Date().getTime() - i*(1000*60*60*24);
            var d = new Date(timestamp).toDateString();
            dateTitles.push(<DateTitle title={d} key={i} index={i}/>)
        }

        return (
            <div style={divStyle} id='slider' className='swipe'>
                <div className='swipe-wrap'>
                    {dateTitles}
                </div>
                <h1 style={rightArrowStyle} onClick={(e) => {
                    this.props.setIndex(this.props.batchIndex-1);
                }}> > </h1>
                <h1 style={leftArrowStyle} onClick={(e) => {
                    this.props.setIndex(this.props.batchIndex+1);
                }}> {"<"} </h1>
            </div>
        )
    }
}

export default DateTitleBox;