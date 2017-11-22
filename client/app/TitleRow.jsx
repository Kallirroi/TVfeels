import React from 'react';
import TitleCell from './TitleCell.jsx'

var TitleRow = React.createClass({
    render: function() {
        var divStyle = {
            top: "5%",
            height:"4%",
            width:"100%",
            fontFamily: "\'Anonymous Pro\' !important",
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "2.2em",
            position: "absolute",
            backgroundColor: "#f5ecb4",
            textAlign: "center"
        };

        var titles = ["PEOPLE", "COUNTRIES", "STATES", "COMPANIES", "ORGANIZATIONS"];
        var titleCells = [];

        titles.forEach(function(val, key){
            titleCells.push(<TitleCell key={key} index={key} title={val}/>);
        });

        return (
            <div style={divStyle}>
                {titleCells}
            </div>
        )
    }
});

export default TitleRow;