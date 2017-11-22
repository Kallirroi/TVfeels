/**
 * Created by weller on 2/4/16.
 */
import React from 'react';

const THUMBOJURE_HOST = "http://thumbojure.um-dokku.media.mit.edu";
//const THUMBOJURE_HOST = "http://localhost:3000";

var getThumbnailUrl = function(url, start, duration) {
    return THUMBOJURE_HOST +"/thumb?url="+encodeURIComponent(url)
      +"&start="+start+"&duration="+duration;
};


var videoStyle = {
    display: "block",
    position: "absolute",
    width: "100%   !important",
    height: "auto   !important",
    zIndex: 100
};

var imgStyle = {
    position: "absolute",
    float:"left",
    left:0, top:0,
    height: "auto",
    width: "150%",
    marginLeft: "-25%",
    marginTop: "-12%"
};

var imgShader = {
    position: "absolute",
    left:0, top:0,
    height: "100%", width:"100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    transition: "all 1s ease"
};

var h1Style = {
    margin: 0,
    position: "absolute",
    float:"left",
    left:0, top:0,
    width:"100%",
    textAlign: "center",
    verticalAlign:"middle",
    alignItems: "center",
    lineHeight: "19vh"
};

var Cell = React.createClass({
    displayName : "Cell",

    getInitialState : function() {
        return {
            selectedScene : 0,
            item: this.props.item,
            zIndex: 10-this.props.item.row
        }
    },

    getCurrentScene : function() {
        return this.state.item.scenes[this.state.selectedScene];
    },

    getNextScene : function() {
        var nextScene = (this.state.selectedScene+1)%this.props.item.scenes.length;
        return this.state.item.scenes[nextScene];
    },

    componentWillReceiveProps: function(nextProps) {
        var currentItem = this.state.item;
        var nextItem = nextProps.item;
        if (nextItem.row>4) {
            //ugly hack for not changing image if cell is out of view
            nextItem.scenes = currentItem.scenes;
        }
        this.setState({
            item: nextItem,
            zIndex: 10-nextItem.row
        });

        var currentScene = this.state.selectedScene;
        var nextScene = nextProps.isPlaying? currentScene : (currentScene+1)%this.props.item.scenes.length;

        if (this.props.isPlaying!=nextProps.isPlaying) {
            this.setState({
                selectedScene: nextScene,
                zIndex: nextProps.isPlaying? 100: 10-this.state.item.row
            });
        }
    },

    click : function() {
        this.props.onClick(this.props.name);
    },

    onPlaying : function() {
        // console.log("PLAYING")
    },

    render : function() {

        var item = this.state.item;
        var divStyle = {
            float: "left",
            display: "block",
            textAlign: "center",
            verticalAlign:"middle",
            alignItems: "center",
            justifyContent: "center",
            backgroundSize: "cover",
            color: "white",
            fontSize: "3em",
            position: "absolute",
            transform : "translate("+item.col*100+"%,"+item.row*100+"%)",
            transition: "all 2s ease",
            height: "20%",
            width: "20%",
            zIndex: this.state.zIndex,
            overflow: "hidden",
            //borderLeft: "20px solid rgb(0,0,0)",
            backgroundColor: "rgb(0,0,0)",
            boxSizing:"border-box",
            border: "20px solid rgb(0,0,0)"
        };

        var videoElement = <div/>;
        var startAt = 0;
        var thumbSrc = "";

        var scene = this.getCurrentScene();
        //var scene = item.scenes[this.state.selectedScene];

        //video setup
        if (scene) {
            startAt = Math.max(scene.first_timestamp, scene.start);
            thumbSrc = getThumbnailUrl(scene.media_url, startAt/1000, 3);
            if (this.props.isPlaying) {
                var videoUrl = `${scene.media_url}#t=${startAt/1000},${scene.end/1000}`;
                videoElement = <video style={videoStyle} src={videoUrl} autoPlay loop onPlaying={this.onPlaying}
                                      onPlay={this.onPlaying}/>;
                var nextScene = this.getNextScene();
                if (nextScene) {
                    var nextStartAt = Math.max(nextScene.first_timestamp, nextScene.start);
                    thumbSrc = getThumbnailUrl(nextScene.media_url, nextStartAt/1000, 3)
                }
            }
        }

        return (
            <div style={divStyle} onClick={this.click}>
                <img style={imgStyle} src={thumbSrc}/>
                <div style={imgShader}></div>
                <h1 style={h1Style}>{item.text.toUpperCase()}</h1>
                <div style={{
                    position: "absolute",
                    left:0, top:0,
                    height: "100%", width:"100%",
                    backgroundColor: this.props.enabled? "rgba(0,0,0,0)" : "rgba(0,0,0,0.7)",
                    transition: "all 1s ease"
                }}></div>
                {videoElement}
            </div>
        );
    }
});

export default Cell;