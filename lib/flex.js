/**
 * 单例类 初始化应用程序的属性
 * 
 */
var app = function(){
	var global = {};
	var context;
	var stopPropagation = false;
	var stopImmediatePropagation = false;
	//初始化舞台
	function init(canvasId,frameRate){
		canvas = document.getElementById(canvasId);
		EventManager.addHandler(canvas,"click",mouseHandler);
		EventManager.addHandler(canvas,"mousedown",mouseHandler);
		EventManager.addHandler(canvas,"mousemove",mouseHandler);
		EventManager.addHandler(canvas,"mouseup",mouseHandler);
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
	 * 应用程序的点击事件 所有的鼠标事件都通过递归的方式来响应
	 */
	function mouseHandler(event){
		try{
			invokeMouseHandler(event,stage);
		}catch(error){
			app.stopPropagation = false;
		}
	}
	/**
	 * 响应click事件的回调函数逻辑
	 * 鼠标事件遵循 捕获 目标 冒泡 三个阶段
	 * 在循环遍历子项列表的时候要倒序 来实现三个阶段
	 */
	function invokeMouseHandler(event,displayObj){
		var numChildren = displayObj.numChildren();
		if(numChildren){
			//如果有子项的话  就递归调用此方法 直到最内层的元素
			var children = displayObj.getChildren();
			for(var i=numChildren-1;i>=0;i--){
				invokeMouseHandler(event,children[i]);
			}
		}else{
			//将event事件对象传入每个显示对象的mouseEvent方法中 根据event的信息来判断是不是要调用注册的回调函数
			displayObj.mouseEvent(event);
			if(app.stopPropagation||app.stopImmediatePropagation){
				throw new Error();
			}
		}
	}
	
	/**
	 * 每一帧都会调用此方法来重绘舞台
	 */
	
	function enterFrame(){
		app.context.clearRect(0,0,app.global.width,app.global.height);
		render(stage);
	}
	/**
	 * 每一帧调用的渲染方法 通过递归的方式调用每一个显示对象的渲染方法
	 * 渲染顺序是从外到内 先渲染父容器再渲染自容器
	 * 因为如果父容器不渲染的话 自容器获取到的父容器的stageX stageY都是0 会导致定位j
	 */
	function render(displayObj){
		if(!(displayObj instanceof Stage)){
			displayObj.render();
		}
		var numChildren = displayObj.numChildren();
		if(numChildren){
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
		context:context,
		stopPropagation:stopPropagation
	}
}();

/**
 * 工具类 
 */
var FlexUtil = {
	/**
	 * 从指定的数组中移除指定的元素
	 */
	removeTargetEle:function(arr,element){
		var eleIndex = arr.indexOf(element);
		if(eleIndex!=-1){
			arr.splice(eleIndex,1);
		}else{
			trace("不存在指定的元素","error");
		}
	},
	/**
	 * 给数组添加唯一的元素
	 */
	addUniqueElement:function(arr,element){
		if(arr.indexOf(element)==-1){
			arr.push(element);
		}else{
			trace("添加了重复的事件侦听器","error");
		}
	}
}

/**
 * 事件管理实例
 */
var EventManager = {
	addHandler:function(element,type,handler){
		if(element.addEventListener){
			element.addEventListener(type,handler,false);
		}else if(element.attachEvent){
			element.attachEvent("on"+type,handler);
		}else{
			element["on"+type] = handler;
		}
	},
	/**
	 * 移除Dom元素注册的事件
	 */
	removeHandler:function(element,type,handler){
		if(element.removeEventListener){
			element.removeEventListener(type,handler,false);
		}else if(element.detachEvent){
			element.detachEvent("on"+type,handler);
		}else{
			element["on"+type] = null;
		}
	}
}
var TouchEvent = function(){
	return { 
			TOUCH_UP:"mouseup",
			TOUCH_DOWN:"mousedown",
			TOUCH_MOVE:"mousemove",
			TOUCH_END:"click"
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
	this.touchUpRegHandlers = [];//注册的touchup事件回调函数
	this.touchDownRegHandlers = [];//注册的touchdown事件回调函数
	this.touchMoveRegHandlers = [];//注册的touchmove事件回调函数
	this.touchEndRegHandlers = [];
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
		if(!(this instanceof Stage)){
			trace(this.constructor.name+"没有实现DisplayObject的render渲染方法","warn")
		}
	},//以下的方法都是关于响应事件的
	isUnderPoint:function(x,y){
		if(x>this.stageX&&x<(this.stageX+this.width)&&y>this.stageY&&y<(this.stageY+this.height)){
			app.stopPropagation = true;//此处将app的stopXXX属性设置为ture 以停止事件继续传播
			return true;
		}
		return false;
	},
	mouseEvent:function(event){//根据鼠标事件的类型响应鼠标事件
		var x = event.offsetX || event.layerX;
		var y = event.offsetY || event.layerY;
		if(!this.isUnderPoint(x,y)){
			return;
		}
		var myEvent = {//将此对象传递给回调函数
			target:this
		};
		if(event.type.indexOf(TouchEvent.TOUCH_DOWN)!=-1){
			for(var i=0;i<this.touchDownRegHandlers.length;i++){
				this.touchDownRegHandlers[i](myEvent);
			}
		}else if(event.type.indexOf(TouchEvent.TOUCH_MOVE)!=-1){
			for(var i=0;i<this.touchMoveRegHandlers.length;i++){
				this.touchMoveRegHandlers[i](myEvent);
			}
		}else if(event.type.indexOf(TouchEvent.TOUCH_UP)!=-1){
			for(var i=0;i<this.touchUpRegHandlers.length;i++){
				this.touchUpRegHandlers[i](myEvent);
			}
		}else if(event.type.indexOf(TouchEvent.TOUCH_END)!=-1){
			for(var i=0;i<this.touchEndRegHandlers.length;i++){
				this.touchEndRegHandlers[i](myEvent);
			}
		}
	},
	addEventListener:function(type,handler){
		switch(type){
			case TouchEvent.TOUCH_DOWN:
				FlexUtil.addUniqueElement(this.touchDownRegHandlers,handler);
				break;
			case TouchEvent.TOUCH_UP:
				FlexUtil.addUniqueElement(this.touchUpRegHandlers,handler);
				break;
			case TouchEvent.TOUCH_MOVE:
				FlexUtil.addUniqueElement(this.touchMoveRegHandlers,handler);
				break;
			case TouchEvent.TOUCH_END:
				FlexUtil.addUniqueElement(this.touchEndRegHandlers,handler);
				break;
			default:
				trace("您注册的"+type+"事件类型不存在","error");
				break;
		}
	},
	removeEventListener:function(type,handler){
		switch(type){
			case TouchEvent.TOUCHE_DOWN:
				FlexUtil.removeTargetEle(this.toucheDownRegHandlers,handler);
				breadk;
			case TouchEvent.TOUCH_UP:
				FlexUtil.removeTargetEle(this.touchUpRegHandlers,handler);
				break;
			case TouchEvent.TOUCH_MOVE:
				FlexUtil.removeTargetEle(this.touchMoveRegHandlers,handler);
				break;
			case TouchEvent.TOUCH_END:
				FlexUtil.removeTargetEle(this.touchEndRegHandlers,handler);
				break;
			default:
				trace("您要移除的"+type+"事件类型不存在","error");
				break;
		}
	},
	/**
	 * 移除组件全部的侦听器
	 */
	removeAllEventListener:function(){
		this.touchDownRegHandlers.length = 0;
		this.touchUpRegHandlers.length = 0;
		this.touchMoveRegHandlers.length = 0
		this.touchEndRegHandlers.length = 0
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
	var argLen = config.length +'';
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
	//根据渲染的image的实际大小和坐标更新FlexImage的x y 以及width height属性
	switch(argLen){
		case '2':
			this.x = this.parent.stageX + this.imageConfig[0];
			this.y = this.parent.stageY + this.imageConfig[1];
			this.width = this.image.width;
			this.height = this.image.height;
			break;
		case '4':
			this.x = this.parent.stageX + this.imageConfig[0];
			this.y = this.parent.stageY + this.imageConfig[1];
			this.width = this.imageConfig[2];
			this.height = this.imageConfig[3];
			break;
		case '8':
			this.x = this.parent.stageX + this.imageConfig[4];
			this.y = this.parent.stageY + this.imageConfig[5];
			this.width = this.imageConfig[6];
			this.height = this.imageConfig[7];
			break;
		default:
			trace("参数个数错误","error");
			break;
	}
}
/**
 * 渲染方法
 */
FlexImage.prototype.render = function(){
	this.load();
}
