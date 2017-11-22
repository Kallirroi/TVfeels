import React from 'react';
import Cell from './Cell.jsx';
import TitleRow from './TitleRow.jsx'
import DateTitleBox from './DateTitleBox.jsx'

var clone = (toClone) => JSON.parse(JSON.stringify(toClone));
var keyComparator = (a,b) => a.key>b.key;

var Root = React.createClass({

    getInitialState : function() {
        return {
            trends:
                [
                    {
                        trends:
                        {
                            PEOPLE : [],
                            COUNTRIES : [],
                            STATES : [],
                            COMPANIES : [],
                            ORGANIZATIONS : []
                        }
                    }
                ],
            data: {},
            trend_index:0,
            cursor: false,
            batchCount: 0,
            selectedCell: null
        }
    },

    updateDimensions: function() {
        this.setState({
            windowHeight: window.innerHeight,
            windowWidth: window.innerWidth
        });
    },

    componentWillMount: function() {
        this.updateDimensions();
    },

    componentDidMount : function() {
        this.tick();
        setInterval(this.tick, 1800000);
        window.addEventListener("resize", this.updateDimensions);
    },

    componentWillUnmount: function() {
        window.removeEventListener("resize", this.updateDimensions);
    },

    unwindTrends(trends) {
        console.log("----unwinding data------");
        var categories = ["PEOPLE", "COUNTRIES", "STATES", "COMPANIES", "ORGANIZATIONS"];
        var data = {};
        categories.forEach(function(category, categoryIndex){ //col
            trends.forEach(function(batch,batchIndex){ //week
                var categoryBatch = batch.trends[category];
                categoryBatch.forEach(function(item, itemIndex){ //row
                    var key = category+","+item.text;
                    item.row = itemIndex;
                    item.col = categoryIndex;
                    if (!data[key]) {
                        data[key] = {
                            text : item.text,
                            col : categoryIndex,
                            items : []
                        };
                    }
                    data[key]["items"][batchIndex] = item;
                });
            });
        });
        console.log(data);
        console.log("------------------------");
        return data;
    },

    tick : function() {
        var self = this;
        console.log("TICK");
        fetch("/api/trends").then(function(response) {
            return response.json();
        }).then(function(data) {
            console.log(data);
            self.setState({
                "data":self.unwindTrends(data.trends),
                "batchCount":data.trends.length
            });
        });
        //.catch(function(err){
        //console.error(err);
        //});
    },

    kbEvent : function(val) {
        console.log("pressed", val);
        switch(val) {
            case 99: //c for cursor
                this.setState({"cursor" : !this.state.cursor});
                console.log("cursor is now : " + this.state.cursor);
                break;
            case 37: //left arrow for back
                console.log("back");
                this.setState({"trend_index" : (this.state.trend_index+1)%this.state.batchCount});
                break;
            case 39: //right arrow front
                console.log("front");
                var trend_index = this.state.trend_index-1;
                trend_index = trend_index<0? trend_index + this.state.batchCount: trend_index;
                this.setState({"trend_index" : trend_index});
                break;
            default:
                return;
        }
    },

    setIndex : function(index) {
        this.setState({"trend_index" : index});
    },

    clickCell : function(key) {
        console.log("cellClick", key);
        var selectedCell;
        if (key===this.state.selectedCell) {
            selectedCell = null;
        } else {
            selectedCell = key;
        }
        this.setState({"selectedCell": selectedCell});
    },

    render : function() {
        var divStyle = {
            fontFamily: "\'Anonymous Pro\' !important",
            fontStyle: "normal",
            fontWeight: 700,
            height: "91%",
            width: "100%",
            position: "absolute",
            zIndex: 0,
            top: "9%"
        };

        var rootStyle = {
            cursor: this.state.cursor ? "default" : "none"
        };

        var trendIndex = this.state.trend_index;
        console.log("rendering with trend index: " + trendIndex);
        var cells = [];
        var data = clone(this.state.data);
        console.log("data is", data);

        for (var key in data) {
            if (data.hasOwnProperty(key)){
                var val = data[key];
                var item;
                if (val["items"][trendIndex]) {
                    item = val["items"][trendIndex];
                } else {
                    item = {
                        text : val.text,
                        col : val.col,
                        row : 6,
                        scenes: []
                    }
                }
                item.batchIndex = trendIndex;
                var isPlaying = (this.state.selectedCell === key);
                var enabled = isPlaying || this.state.selectedCell==null;
                cells.push(<Cell key = {key}
                                 enabled = {enabled}
                                 name = {key}
                                 isPlaying = {isPlaying}
                                 item = {item}
                                 onClick = {this.clickCell}
                />)
            }
        }
        cells.sort(keyComparator);

        return (
            <div style={rootStyle}>
                <DateTitleBox batchIndex={trendIndex} setIndex={this.setIndex}/>
                <TitleRow/>
                <div style={divStyle}>
                    {cells}
                </div>
            </div>
        );
    }
});

export default Root;