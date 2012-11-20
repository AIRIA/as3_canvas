/**
 * @class 管理应用程序的单例类  此类不能实例化
 */
var Flex = function() {
	var scaleX;
	//targetWidth/realWidth 构成的比例 用来缩放程序
	var scaleY;
	//targetHeight/realHeight
	/**
	 * canvas上下文
	 */
	var context;
	/**
	 * 保存canvas的全局属性
	 */
	var global = {};
	
	var device = "mobile";
	
	/**
	 * 在程序执行前必须 初始化程序
	 * @param {String} Dom中的Id
	 * @param {Number} 渲染的帧速 默认是24
	 * @param {Number} 标准的宽度
	 * @param {Number} 标准的高度
	 * @param {Number} 实际设备的显示宽度
	 * @param {Number} 实际设备的显示高度
	 */
	function initApp(canvasId, frameRate, targetWidth, targetHeight, realWidth, realHeight) {
		var canvas = document.getElementById(canvasId);
		//初始化事件监听器
		initEventListener(canvas);
		if(canvas.getContext) {
			this.context = canvas.getContext("2d");
			this.scaleX = targetWidth/realWidth;
			this.scaleY = targetHeight/realHeight;
			global.width = canvas.width;
			global.height = canvas.height;
		} else {
			alert("Your Browser Doesn't Support HTML5 \nPlease Try Chrome,IE9+,FireFox3.6+,Opera10+ etc.");
		}
		window.stage = new Stage();
		setInterval(enterFrame,Math.round(1000/frameRate));
	}
	/**
	 * 安全执行方法 避免异常退出
	 * @private
	 */
	function safeRun(handler){
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		try{
			handler.apply(null,args);
		}catch(error){
			
		}
	}
	
	/**
	 * 根据设备类型初始化事件监听器
	 * @private
	 */
	function initEventListener(canvas){
		if(window.navigator.userAgent.indexOf("Android")==-1){
			Flex.device = "pc";
			TouchEvent.TOUCH_END = "click";
			TouchEvent.TOUCH_START = "mousedown";
			TouchEvent.TOUCH_MOVE = "mousemove";
		}
		EventManager.addHandler(canvas,TouchEvent.TOUCH_START,touchStartHandler);
		EventManager.addHandler(canvas,TouchEvent.TOUCH_END,touchEndHandler);
	}
	/**
	 * 鼠标或者手指按下的时候触发 
	 * @private
	 */
	function touchStartHandler(event){
		//禁止滚动
		event.preventDefault();
		//按下的时候 才开始监听touchmove事件
		EventManager.addHandler(event.target,TouchEvent.TOUCH_MOVE,touchMoveHandler);
		safeRun(startEventListener,event,stage);
	}
	/**
	 * 鼠标或者手指按下 并拖动的时候触发
	 * @private
	 */
	function touchMoveHandler(event){
		//禁止滚动
		event.preventDefault();
		safeRun(startEventListener,event,stage);
	}
	/**
	 * 鼠标或者手指抬起的时候
	 * @private
	 */
	function touchEndHandler(event){
		EventManager.removeHandler(event.target,TouchEvent.TOUCH_MOVE,touchMoveHandler);
		safeRun(startEventListener,event,stage);
	}
	/**
	 * 每次触发事件的时候 启动事件监听器 
	 * 事件触发分为三个阶段 捕获阶段 目标阶段 冒泡阶段 
	 * startEventListener方法 监测事件是从外到内执行的 即先从stage开始进行递归 一级一级的进行事件的监测
	 * 循环到最内层的元素后 开始执行回调函数 然后一层一层向外父级扩散
	 */
	function startEventListener(event,displayObj)
	{
		var touch;
		if(Flex.device=="pc"){
			touch = event;
		}else if(event.type == TouchEvent.TOUCH_START){
			touch = event.touches[0];
		}else{
			touch = event.changedTouches[0];
		}
		
		var numChildren = displayObj.numChildren;
		if(numChildren){
			//如果有子项的话  就递归调用此方法 直到最内层的元素
			var children = displayObj.getChildren();
			for(var i=numChildren-1;i>=0;i--){
				arguments.callee(event,children[i]);
			}
		}else{
			//将event事件对象传入每个显示对象的mouseEvent方法中 根据event的信息来判断是不是要调用注册的回调函数
			if(displayObj.isUnderPoint(touch)){
					displayObj.dispatchEvent(event);
			}
		}
	}
	
	/**
	 * 每一帧都会调用此方法来重绘舞台
	 */
	function enterFrame(){
		Flex.context.clearRect(0,0,Flex.global.width,Flex.global.height);
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
		var numChildren = displayObj.numChildren;
		if(numChildren){
			var children = displayObj.getChildren();
			for(var i=0;i<numChildren;i++){
				arguments.callee(children[i]);
			}
		}
	}

	/**
	 * 继承使用的工具方法
	 * @param {Function} 子类
	 * @param {Function} 要继承的父类
	 */
	function inherit(subClass, supClass) {
		subClass.prototype = new supClass;
		subClass.superClass = supClass.prototype;
		subClass.prototype.constructor = subClass;
	}

	return {
		inherit : inherit,
		initApp:initApp,
		context : context,
		global:global,
		device:device
	};
}();

/**
 * @class FlexEvent 类作为创建 Event 对象的基类，当发生事件时，Event 对象将作为参数传递给事件侦听器。
 * @param {String} 事件类型 
 * @description FlexEvent 类的属性包含有关事件的基本信息
 * @constructor 构造方法
 */
function FlexEvent(type){
	/**
	 * @descrption [read-only] 事件目标。 
	 */
	this.target = null;
	
	/**
	 * [read-only] 当前正在使用某个事件侦听器处理 Event 对象的对象。
	 */
	this.currentTarget = null;
	/**
	 * 事件类型
	 */
	this.type = type;
	
	/**
	 * [read-only] 指示事件是否为冒泡事件。
	 */
	this.bubbles = false;
	/**
	 * 是不是要停止事件传播 
	 */
	this._stopPropagation = false;
	/**
	 * 是不是要停止事件传播 并且立刻停止方法的执行
	 */
	this._stopImmeditaPropagation = false;
}

FlexEvent.prototype.stopPropagation = function(){
	//TO-DO
	this._stopPropagation = true;
}

FlexEvent.prototype.stopImmediatePropagation = function(){
	//TO-DO
	this._stopPropagation = true;
}

/**
 * @class EventDispatcher 用于添加或删除事件侦听器的方法，检查是否已注册特定类型的事件侦听器，并调度事件。，并且是 DisplayObject 类的基类。
 */
function EventDispatcher(){
	 this.events = {};
}

EventDispatcher.prototype = {
	constructor:EventDispatcher,
	/**
	 * 添加事件监听器
	 * @param {String} 添加的事件类型
	 * @param {Function} 事件触发的回调函数
	 * @param {Boolean} 是否启用捕获阶段
	 */
	addEventListener:function(type,handler,useCapture){
		if(!this.events[type]){
			this.events[type] = {
				captureHandlers:[],
				normalHandlers:[]
			};
		}
		var evt = this.events[type];
		//捕获阶段的回调函数
		if(useCapture){
			evt.captureHandlers.push(handler);
		}else{
			//添加到目标和冒泡阶段的回调函数
			evt.normalHandlers.push(handler);
		}
		
	},
	hasEventListener:function(type){
		if(this.events[type].lenght){
			return true;
		}
		return false;
	},
	/**
	 * 移除指定的监听器
	 */
	removeEventListener:function(type,handler,useCapture){
		var evt = this.events[type];
		useCapture = useCapture || false;
		if(useCapture){
			FlexUtil.removeElement(evt.captureHandlers,handler);
		}else{
			FlexUtil.removeElement(evt.normalHandlers,handler);
		}
	},
	dispatchEvent:function(event){
		event.target = this;
		var evt = this.events[event.type];
		if(evt){
			var normalHandlers = evt.normalHandlers;
			var captureHandlers = evt.captureHandlers;
			for(var i=0;i<normalHandlers.length;i++){
				normalHandlers[i].call(this,event);
			}
		}
		var parent = this.parent;
		if(parent){
			parent.dispatchEvent(event);
		}else{
			throw new Error("normal quit");
		}
	}
}


/**
 * @class 事件管理实例 此类不能实例化
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

/**
 * @class 用来在控制台打印消息
 */
function trace() {
	var logType = ['log', 'error', 'info', 'warn'];
	var type = "log";
	var content = "";
	for(var i = 0; i < arguments.length; i++) {
		if(i == arguments.length - 1) {
			if(logType.indexOf(arguments[i]) != -1) {
				type = arguments[i];
				content = content.slice(0, content.length - 1);
			} else {
				content += "arguments[" + i + "]";
			}
		} else {
			content += "arguments[" + i + "],";
		}
	}
	content += ")";
	res = "console." + type + "(" + content;
	eval(res);
}

/**
 * @class DisplayObject 类是可放在显示列表中的所有对象的基类
 * @param {Object} 配置一些属性
 * @extends EventDispatcher
 */
function DisplayObject(config) {
	EventDispatcher.call(this);
	config = config || {};
	this._x = config.x || 0;
	this._y = config.y || 0;
	this.stageX = config.stageX || 0;
	this.stageY = config.stageY || 0;
	this._width = NaN;
	this._height = NaN;
	/**
	 * @property
	 */
	this.alpha = config.alpha || 1;
	this.scaleX = config.scaleX || 1;
	this.scaleY = config.scaleY || 1;
	/**
	 * @property
	 */
	this.visible = config.visible || true;
	/**
	 * 旋转角度
	 * @property
	 */
	this.rotation = config.rotation || 0;
	/**
	 * @property
	 */
	this.mask = null;
	/**
	 * 父组件列表
	 * @property
	 */
	this.parent = null;
	/**
	 * canvas上下文
	 * @property
	 */
	this.context = Flex.context;
	Object.defineProperties(this, {
		/**
		 * 显示对象的宽度
		 * @property
		 */
		width : {
			get : function() {
				return this._width;
			},
			set : function(value) {
				if(this._width != value) {
					this._width = value;
				}
			}
		},
		height : {
			get : function() {
				return this._height;
			},
			set : function(value) {
				if(this._height != value) {
					this._height = value;
				}
			}
		},
		x:{
			get:function(){
				return this._x;
			},
			set:function(value){
				if(this._x!=value){
					this._x = value;
					if(this.parent){
						this.stageX = this._x+this.parent.stageX;
						if(this.layout){
							this.layout();
						}
					}
				}
			}
		},
		y:{
			get:function(){
				return this._y;
			},
			set:function(value){
				if(this._y!=value){
					this._y = value;
					if(this.parent){
						this.stageY = this._y+this.parent.stageY;
						if(this.layout){
							this.layout();
						}
					}
				}
			}
		}
	});
}

Flex.inherit(DisplayObject,EventDispatcher);

DisplayObject.prototype.getBounds = function() {
	//TO-DO
}

DisplayObject.prototype.updateProperties = function(){
	trace("没有添加更新属性的逻辑实现",Log.WARN);
}

DisplayObject.prototype.getRect = function() {
	return new Rectangle({
		x:this.x,
		y:this.y,
		w:this.width,
		h:this.height
	});
}

/**
 * @param {TOUCHEEVENT} 必须是touch事件
 */
DisplayObject.prototype.isUnderPoint = function(touch){
	var x = touch.pageX;
	var y = touch.pageY;
	if(x>this.stageX&&x<(this.stageX+this.width)&&y>this.stageY&&y<(this.stageY+this.height)){
		//app.stopPropagation = true;//此处将app的stopXXX属性设置为ture 以停止事件继续传播
		return true;
	}
	return false;
}

/**
 * @class Graphics 类包含一组可用来创建矢量形状的方法。 支持绘制的显示对象包括 Sprite 和 Shape 对象。
 * @param{DisplayObject}
 */
function Graphics(displayObj) {
	this.owner = displayObj;
	this._steps = [];
}

Graphics.prototype = {
	constroctor : Graphics,
	beginFill : function(color) {
		Flex.context.fillStyle = color;
	},
	/**
	 * @param {Number} 线条的粗细
	 * @param {uint} 线条的颜色
	 * @param {String} 线条的风格
	 */
	lineStyle : function(weight, color, lineCap) {
		var steps = this._steps;
		steps.push({prop:"strokeStyle",value:color});
		steps.push({prop:'lineWidth',value:weight});
		steps.push({prop:'lineCap',value:lineCap});
	},
	/**
	 * 清楚已经话的内容
	 */
	clear:function(){
		this._steps.length = 0;
	},
	drawRect : function(x, y, width, height) {
		this._steps.push({prop:'fillRect',value:[this.owner.stageX + x,this.owner.stageY + y,width,height]});
	},
	drawCircle : function(x, y, radius) {
		var steps = this._steps;
		steps.push({prop:'beginPath',value:[]});
		steps.push({prop:'arc',value:[this.owner.stageX + x, this.owner.stageY + y, radius, 0, Math.PI * 2, false]});
		steps.push({prop:'fill',value:[]});
		steps.push({prop:'stroke',value:[]});
	},
	/**
	 *
	 */
	endFill : function() {
		Flex.context.restore();
	},
	lineTo : function(x, y) {
		this._steps.push({prop:'lineTo',value:[this.owner.stageX + x, this.owner.stageY + y]});
	},
	moveTo : function(x, y) {
		this._steps.push({prop:'moveTo',value:[this.owner.stageX + x, this.owner.stageY + y]});
	},
	/**
	 * 渲染graphics的步骤
	 */
	render:function(){
		var currentStep;
		var steps = this._steps;
		var context = Flex.context;
		//执行steps中保存的步骤
		for(var i=0;i<steps.length;i++){
			currentStep = steps[i];
			var prop = context[currentStep.prop];
			var val = currentStep.value;
			if(prop instanceof Function){
				prop.apply(context,val);
			}else{
				prop = currentStep.value;
			}
		}
	}
}

/**
 * @class 只用来绘制图形 不具有交互性
 */
function Shape(config) {
	DisplayObject.call(this, config);
	this._graphics = null;
	Object.defineProperties(this, {
		graphics : {
			/**
			 * 只有在使用的时候才进行实例化
			 */
			get : function() {
				if(!this._graphics) {
					this._graphics = new Graphics(this);
				}
				return this._graphics;
			}
		}
	});
}

Flex.inherit(Shape, DisplayObject);

Shape.prototype.render = function(){
	this.graphics.render();
}

/**
 * @class 显示列表的容器类
 * @param {JSON} 配置属性
 * @extends {DisplayObject}
 */
function DisplayObjectContainer(config) {
	DisplayObject.call(this, config);
	this._children = [];
	this._numChildren = 0;
	//只读
	Object.defineProperties(this, {
		/**
		 * [read-only] 返回此对象的子项数目。
		 */
		numChildren : {
			get : function() {
				return this._children.length;
			}
		}
	});
}

Flex.inherit(DisplayObjectContainer, DisplayObject);

/**
 * 验证属性 此方法只被addChildXXX方法调用 用来确定显示对象在舞台上的位置
 */
DisplayObjectContainer.prototype.validateProperties = function(child){
	child.stageX = child.x + this.stageX;
	child.stageY = child.y + this.stageY;
	this.layout();
}

/**
 * 将一个 DisplayObject 子实例添加到该 DisplayObjectContainer 实例中。
 * @return {DisplayObject} 添加的实例
 */
DisplayObjectContainer.prototype.addChild = function(child) {
	if(this._children.indexOf(child) == -1) {
		this._children.push(child);
		child.parent = this;
		this.validateProperties(child);
	} else {
		trace("显示列表中已经存在了" + child + "对象实例", Log.ERROR)
	}
	return child;
}

DisplayObjectContainer.prototype.layout = function(){
	var children = this.getChildren();
	var numChildren =this.numChildren;
	var child;
	for(var i=0;i<numChildren;i++){
		child = children[i];
		if(child instanceof DisplayObjectContainer){
			child.layout();
		}
		child.stageX = child.x + this.stageX;
		child.stageY = child.y + this.stageY;
	}
}

/**
 * 批量添加child 用逗号分隔开
 */
DisplayObjectContainer.prototype.addChildren = function() {
	var child;
	for(var i = 0; i < arguments.length; i++) {
		child = arguments[i]
		if( child instanceof DisplayObject) {
			this._children.push(child);
			child.parent = this;
		} else {
			trace(child + "不是DisplayObject的实例", Log.WARN);
		}
	}
	this.validateProperties(child);
}
/**
 * 将一个 DisplayObject 子实例添加到该 DisplayObjectContainer 实例中。
 * @param {DisplayObject} 要添加到显示列表中的显示对象
 * @param {Number} 要添加到的位置索引
 */
DisplayObjectContainer.prototype.addChildAt = function(child, index) {
	this._children.splice(index - 1, 0, child);
	this.validateProperties(child);
	child.parent =this;
	return child;
}
/**
 * 确定指定显示对象是否在此容器的子项列表中
 */
DisplayObjectContainer.prototype.contains = function(displayObj) {
	if(this._children.indexOf(displayObj) == -1) {
		return false;
	} else {
		return true;
	}
}

/**
 * 返回全部的子项显示对象
 */
DisplayObjectContainer.prototype.getChildren = function(){
	return this._children;
}

/**
 * 返回位于指定索引处的子显示对象实例。
 */
DisplayObjectContainer.prototype.getChildAt = function(index) {
	if(index > this._children.length) {
		throw new Error("超出索引异常");
		return null;
	} else {
		return this._children[index];
	}
}
/**
 * 返回 DisplayObject 的 child 实例的索引位置。
 */
DisplayObjectContainer.prototype.getChildIndex = function(child) {
	var index = this._children.indexOf(child);
	if(index != -1) {
		return index;
	} else {
		throw new Error(this + "显示列表中不存在" + child + "对象实例");
	}
}
/**
 * 从 DisplayObjectContainer 实例的子列表中删除指定的 child DisplayObject 实例。
 */
DisplayObjectContainer.prototype.removeChild = function(child) {
	var childIndex = this._children.indexOf(child);
	if(childIndex == -1) {
		trace(this.constructor.name + "对象实例中不存在" + child, "error");
		return;
	}
	this._children.splice(childIndex, 1);
	return child;
}
/**
 * 从 DisplayObjectContainer 的子列表中指定的 index 位置删除子 DisplayObject。
 */
DisplayObjectContainer.prototype.removeChildAt = function(index) {
	var child = this._children[index];
	this._children.splice(index, 1);
	return child;
}
/**
 * 交换两个指定子对象的 Z 轴顺序（从前到后顺序）。
 */
DisplayObjectContainer.prototype.swapChildren = function(child1, child2) {
	var childList = this._children;
	var ind1 = childList.indexOf(child1);
	var ind2 = childList.indexOf(child2);
	if(ind1 == -1 || ind2 == -1) {
		trace("swapChildren参数异常 不存在交换的元素", "error");
		return;
	}
	childList[ind2] = child1;
	childList[ind1] = child2;
}
/**
 * @class Stage是显示列表的顶级容器
 */
function Stage(config){
	DisplayObjectContainer.call(this,config);
	this.stageWidth = Flex.global.width;
	this.stageHeight = Flex.global.height;
}

Flex.inherit(Stage,DisplayObjectContainer);

/**
 * @class Sprite 类是基本显示列表构造块：一个可显示图形并且也可包含子项的显示列表节点。
 */
function Sprite(config){
	DisplayObjectContainer.call(this,config);
	this._graphics = null;
	Object.defineProperties(this, {
		graphics : {
			/**
			 * 只有在使用的时候才进行实例化
			 */
			get : function() {
				if(!this._graphics) {
					this._graphics = new Graphics(this);
				}
				return this._graphics;
			}
		}
	});
}

Flex.inherit(Sprite,DisplayObjectContainer);
/**
 * 允许用户拖动指定的 Sprite。
 * @param {Rect}  
 */
Sprite.prototype.startDrag = function(bounds){
	
}
/**
 * 结束 startDrag() 方法。
 */
Sprite.prototype.stopDrag = function(){
	
}

Sprite.prototype.render = function(){
	this.graphics.render();
}

/**
 * @class Bitmap 类表示用于表示位图图像的显示对象。
 */
function Bitmap(bitmapData,rect,config){
	DisplayObject.call(this,config);
	this.bitmapData = bitmapData;
	this._rect = rect;
	if(rect){
		this.width = rect.w;
		this.height = rect.h;
	}
	Object.defineProperties(this,{
		rect:{
			get:function(){
				return this._rect;
			},
			set:function(value){
				if(this._rect!=value){
					this._rect = value;
					this.width = value.w;
					this.height = value.h;
				}
			}
		}
	});
}

Flex.inherit(Bitmap,DisplayObject);
Bitmap.prototype.render = function(){
	var bd = this.bitmapData;
	var rect = this.rect;
	if(!rect){
		rect = bd.getRect();
	}
	if(bd.loaded){
		var width,height;
		if(this.width){
			width = this.width;	
		}else{
			width = rect.w;
		}
		if(this.height){
			height = this.height;
		}else{
			height = rect.h;
		}
		Flex.context.drawImage(bd.content,rect.x,rect.y,rect.w,rect.h,this.stageX,this.stageY,width,height);
	}
}

/**
 * @class 继承Image 保存Image的信息
 */
function BitmapData(x,y,width,height){
	this.content = null;
	this._src = null;
	this.loaded = false;
	Object.defineProperties(this,{
		src:{
			get:function(){
				return this._src;
			},
			set:function(value){
				if(this._src!=value){
					this._src = value;
					if(!this.content){
						var self = this;
						this.content = new Image();
						this.content.src = value;
						this.content.onload = function(){
							self.loaded = true;
							self.x = this.x;
							self.y = this.y;
							self.width = this.width;
							self.height = this.height;
						}
					}
				}
			}
		}
	});
}

BitmapData.prototype.getRect = function(){
	return new Rectangle({
		x:this.x,
		y:this.y,
		w:this.width,
		h:this.height
	});
}

/**
 * @class TextFormat 类描述字符格式设置信息。 使用 TextFormat 类可以为文本字段创建特定的文本格式
 */
function TextFormat(config){
	config = config || {};
	//文字应用的字体
	this.fontFamily = config.fontFamily||'Arial';
	//字体大小
	this.fontSize = config.fontSize||12;
	//字体的粗细
	this.fontWeight = config.fontWeight||'normal';
	//文字对齐方式
	this.textAlign = config.textAlign||TextAlign.START;
	//文字的基线
	this.textBaseline = config.textBaseline||TextBaseline.TOP;
	//文字填充的样式 例如#333333 或者 rgba(12,12,12,0.4);
	this.fillStyle = config.fillStyle||'#333333';
}

/**
 * @class TextField 类用于创建显示对象以显示和输入文本。
 */
function TextField(config){
	DisplayObject.call(this,config);
	config = config || {}
	this.label = null;
	this.fontSize = config.fontSize || 12;
	this.fillStyle = config.fillStyle || '#333333';
	this.textAlign = config.textAlign||TextAlign.START;
	this.textBaseline = config.textBaseline||TextBaseline.TOP;
	this.fontFamily = config.fontFamily||'Arial';
	this.fontWeight = config.fontWeight||'normal';
	this.textFormat = null;
	Object.defineProperties(this,{
		//[Read-Only]
		textWidth:{
			get:function(){
				var context = this.context;
				var style = this.textFormat?this.textFormat:this;
				context.save();
				context.font = style.fontWeight+" "+style.fontSize+"px "+style.fontFamily;
				this._textWidth = context.measureText(this.label).width;
				return this._textWidth;
			}
		}
	})
}
Flex.inherit(TextField,DisplayObject);

TextField.prototype.render = function(){
	if(this.label.length){
		var context = this.context;
		var style = this.textFormat?this.textFormat:this;
		context.save();
		context.fillStyle = style.fillStyle; 
		context.font = style.fontWeight+" "+style.fontSize+"px "+style.fontFamily;
		context.textAlign = style.textAlign;
		context.textBaseline = style.textBaseline;
		context.fillText(this.label,this.stageX,this.stageY);
		context.restore();
	}
}

/**
 * @class Button 组件表示常用的矩形按钮
 */
function Button(upskin,downskin,config){
	config = config ||{};
	DisplayObjectContainer.call(this,config);
	/**
	 * 正常的皮肤
	 */
	this.upSkin = upskin;
	/**
	 * 按下的皮肤
	 */
	this.downSkin = downskin;
	this._currentSkin = this.upSkin;
	this._label = config.label;
	this._textField = null;
	this._textFormat = null;
	this.upSkin.addEventListener(TouchEvent.TOUCH_START,startHandler);
	this.downSkin.addEventListener(TouchEvent.TOUCH_END,endHandler);
	var self = this;
	function startHandler(event){
		self.currentSkin = self.downSkin;
	}
	
	function endHandler(event){
		self.currentSkin = self.upSkin;
	}
	
	Object.defineProperties(this,{
		label:{
			get:function(){
				return this._label;
			},
			set:function(value){
				if(this._label!=value){
					this._label = value;
					if(!this._textField){
						this._textField = new TextField();
						this.addChild(this._textField);
					}
					this._textField.label = this._label;
				}
			}
		},
		currentSkin:{
			get:function(){
				return this._currentSkin;
			},
			set:function(value){
				if(this._currentSkin!=value){
					//皮肤发生改变的时候 如果当前皮肤已经添加到了显示列表中 先移除
					if(this.contains(this._currentSkin)){
						this.removeChild(this._currentSkin);
					}
					this._currentSkin = value;
					this.addChildAt(this._currentSkin,0);
					this.width = this._currentSkin.width;
					this.height = this._currentSkin.height;
				}else if(!this.contains(this._currentSkin)){
					this.addChildAt(this._currentSkin,0);
					this.width = this._currentSkin.width;
					this.height = this._currentSkin.height;
				}
			}
		}
	});
	
	this.currentSkin = self.upSkin;
}
Flex.inherit(Button,DisplayObjectContainer);
Button.prototype.render = function(){
	//TO-DO
}

/**
 * @class 横向布局的容器
 */
function HGroup(config){
	config = config || {};
	Sprite.call(this,config);
	/**
	 * 元素于元素之间的间距
	 */
	this._gap = config.gap||0;
	Object.defineProperties(this,{
		gap:{
			get:function(){
				return this._gap;
			},
			set:function(value){
				if(this._gap!=value){
					this._gap = value;
					this.layout();
				}
			}	
		}
	});
}

Flex.inherit(HGroup,Sprite);

/**
 * 刷新布局
 */
HGroup.prototype.layout = function(){
	this.width = 0;
	var children = this.getChildren();
	for(var i=0;i<this.numChildren;i++){
		if(i){
			children[i].x = this.width+this.gap;
			children[i].stageX = children[i].x + this.stageX;
		}else{
			children[i].stageX = this.stageX;
			children[i].x = 0;
		}
		children[i].stageY = this.stageY+children[i].stageY;
		this.width = children[i].x+children[i].width;
		trace(i,this.width,children[i].x);
	}
}

/**
 * @override 
 */
HGroup.prototype.addChild = function(child){
	Sprite.prototype.addChild.call(this,child);
	//第一个child 忽略gap
	if(this.numChildren!=1){
		child.x = this.width + this.gap;
	}else{
		child.x = 0;
	}
	this.width = child.x + child.width;
}

/**
 * Rectangle 对象是按其位置（由它左上角的点 (x, y) 确定）以及宽度和高度定义的区域。 
 */
function Rectangle(config){
	config = config || {};
	this.x = config.y || 0;
	this.y = config.y || 0;
	this.w = config.w || 0;
	this.h = config.h || 0;
}
//-----------FlexUtil-----------------
//-----------Consts-------------------

/**
 * @class 
 */
var FlexUtil = {
	/**
	 * 从指定的数组中移除元素
	 * @param {Array} 要移除元素的数组
	 * @param {Object} 要移除的元素
	 */
	removeElement:function(arr,ele){
		var index = arr.indexOf(ele);
		if(index!=-1){
			arr.splice(index,1);
		}else{
			throw new Error("数组中不存在指定的元素");
		}
	}
};


/**
 * @class 文本对齐方式
 */
var TextAlign = {
	START:'start',
	END:'end',
	LEFT:'left',
	RIGHT:'right',
	CENTER:'center'
}
/**
 * @class 文本的基线
 */
var TextBaseline = {
	TOP:'top',
	HANGING:'hanging',
	MIDDLE:'middle',
	ALPHABETIC:'alphabetic',
	IDEOGRAPHIC:'ideographic',
	BOTTOM:'bottom'
}

/**
 * 线条的风格 静态常量
 */
var LineCap = {
	BUTT : 'butt', //每根线的头和尾都是长方形，也就是不做任何的处理，为默认值
	ROUND : 'round', //每根线的头和尾都增加一个半圆形的箭头
	SQUARE : "square"//每根线的头和尾都增加一个长方形，长度为线宽一半，高度为线宽
}

/**
 * @class 日志打印级别 常量
 */
var Log = {
	ERROR : 'error',
	INFO : 'info',
	WARN : 'warn'
}
/**
 * @class 触摸事件
 */
var TouchEvent = {
	TOUCH_START:'touchstart',
	TOUCH_END:'touchend',
	TOUCH_MOVE:'touchmove'
}
