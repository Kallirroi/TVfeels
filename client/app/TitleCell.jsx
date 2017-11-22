import React from 'react';

var TitleCell = React.createClass({
    render: function() {
        var divStyle = {
            height:"100%",
            width:"20%",
            float: "left"
        };

        return (
            <h1 style={divStyle}>{this.props.title}</h1>
        )
    }
});

export default TitleCell;