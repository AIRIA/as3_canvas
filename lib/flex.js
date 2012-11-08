/**
 * 单例类 初始化应用程序的属性
 * 
 */
var app = function(){
	var global = {};
	var context;
	//初始化舞台
	function init(canvasId,frameRate){
		canvas = document.getElementById(canvasId);
		global.width = canvas.width;
		global.height = canvas.height;
		global.frameRate = frameRate;
		if(canvas.getContext){
			this.context = canvas.getContext("2d");
		}else{
			alert("Your browser doesn't support HTML5!\nPlease try Chrome,Firefox3.6+,IE9+ or Opera10+!")
		}
		window.stage = new Stage();
		setInterval(enterFrame,Math.round(1000/frameRate));
	}
	
	/**
	 * 每一帧都会调用此方法来重绘舞台
	 */
	function enterFrame(){
		app.context.clearRect(0,0,app.global.width,app.global.height);
		render(stage);
	}
	
	/**
	 * 每一帧调用的渲染方法
	 * 渲染顺序是从外到内 先渲染父容器再渲染自容器
	 * 因为如果父容器不渲染的话 自容器获取到的父容器的stageX stageY都是0 会导致定位
	 */
	function render(displayObj){
		displayObj.render();
		var numChildren = displayObj.numChildren();
		if(displayObj.numChildren){
			var children = displayObj.getChildren();
			for(var i=0;i<numChildren;i++){
				displayObj.validateProperties(children[i]);
				render(children[i]);
			}
		}
	}
	
	return{
		init:init,
		global:global,
		context:context
	}
}();


//--------------------------------------------------
/**
 * 用来在控制台打印消息
 */
function trace(){
	var logType = ['log','error','info','warn'];
	var type = "log";
	var content = "";
	for(var i=0;i<arguments.length;i++){
		if(i == arguments.length-1){
			if(logType.indexOf(arguments[i])!=-1){
				type = arguments[i];
				content = content.slice(0,content.length-1);
			}else{
				content += "arguments["+i+"]";	
			}
		}else{
			content += "arguments["+i+"],";	
		}
	}
	content += ")";
	res = "console."+type+"("+content;
	eval(res);
}
//---------以下都是自定义类------------
/**
 * @class DisplayObject
 */
function DisplayObject(config){
	config = config || {};
	this.width = config.width || 0;
	this.height = config.height || 0;
	this.x = config.x || 0;
	this.y = config.y || 0;
	this.parent = null;
	this._children = [];
	this._numChildren = 0;
	this.stageX = 0;
	this.stageY = 0;
}
DisplayObject.prototype = {
	constructor:DisplayObject,
	getChildren:function(){
		return this._children;
	},
	numChildren:function(){
		return this._children.length;
	},
	addChild:function(child){
		this._children.push(child);
		child.parent = this;
		return child;
	},
	validateProperties:function(child){
		child.stageX = child.x + this.stageX;
		child.stageY = child.y + this.stageY;
	},
	addChildAt:function(child,index){
		this._children.splice(index-1,0,child);
		return child;
	},
	contains:function(child){
		if(this._children.indexOf(child)==-1){
			return false;
		}
		return true;
	},
	getChildAt:function(index){
		return this._children[index];
	},
	removeChild:function(child){
		var childIndex = this._children.indexOf(child);
		if(childIndex==-1){
			trace(this.constructor.name+"对象实例中不存在"+child,"error");
			return;	
		}
		this._children.splice(childIndex,1);
		return child;
	},
	removeChildAt:function(index){
		var child = this._children[index];
		this._children.splice(index,1);
		return child;
	},
	swapChildren:function(child1,child2){
		//TO-DO
	},
	swapChildrenAt:function(index1,index2){
		//TO-DO
	},
	render:function(){
		if(this.constructor.name!="Stage"){
			trace(this.constructor.name+"没有实现DisplayObject的render渲染方法","warn")
		}
	}
}
/**
 * @class Stage
 * 应用程序的舞台
 */
function Stage(config){
	DisplayObject.call(this,config);
	this.stageWidth = app.global.width;
	this.stageHeight = app.global.height;
	this.frameRate = app.global.frameRate;
	this.context = app.context;
}

Stage.prototype = new DisplayObject();
Stage.prototype.constructor = Stage;

/**
 * 
 */
function Sprite(config){
	DisplayObject.call(this,config);
	this.graphics = new Graphics(this);
	this.buttonMode = false;
	this.stage = stage;
}

Sprite.prototype = new DisplayObject();
Sprite.prototype.constructor = Sprite;

/**
 * @class Graphics
 * Graphics 类包含一组可用来创建矢量形状的方法。
 */
function Graphics(sprite){
	this.sprite = sprite;
}
Graphics.prototype = {
	beginFill:function(color){
		app.context.fillStyle = color;
	},
	lineStyle:function(weight,color){
		app.context.strokeStyle = color;
		app.context.lineWidth = weight;
	},
	drawRect:function(x,y,width,height){
		app.context.fillRect(this.sprite.stageX+x,this.sprite.stageY+y,width,height);
	},
	drawCircle:function(x,y,radius){
		app.context.arc(this.sprite.stageX+x,this.sprite.stageY+y,radius,0,Math.PI*2,false);
		app.context.fill();
	}
}
/**
 * @class FlexImage 显示图像的控件
 * @extends DisplayObject
 * 
 */
function FlexImage(config){
	DisplayObject.call(this,config);
	this.image = null;
	this.src = config.src
	this.imageConfig = config.imageConfig;
}

FlexImage.prototype = new DisplayObject();
FlexImage.prototype.constructor = FlexImage;
FlexImage.prototype.load = function(){
	var self = this;
	var config = self.imageConfig;
	if(!this.image){
		this.image = new Image();
		this.image.src = this.src;
		this.image.onload = function(){
			var commandStr = "app.context.drawImage(this,";
			for(var i=0;i<config.length;i++){
				if(i==config.length-1){
					commandStr += "config["+i+"])";
				}else{
					commandStr += "config["+i+"],";
				}
			}
			trace(commandStr);
			eval(commandStr);
		}
	}else{
		var commandStr = "app.context.drawImage(this.image,";
			for(var i=0;i<config.length;i++){
				if(i==config.length-1){
					commandStr += "config["+i+"])";
				}else{
					commandStr += "config["+i+"],";
				}
			}
			eval(commandStr);
	}
}
/**
 * 
 */
FlexImage.prototype.render = function(){
	this.load();
}
