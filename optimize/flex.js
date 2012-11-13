var Flex = function() {
	var scaleX;
	//targetWidth/realWidth 构成的比例 用来缩放程序
	var scaleY;
	//targetHeight/realHeight
	var context;
	//canvas 上下文
	var global = {};
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
		subClass.prototype.constructor = subClass;
	}

	return {
		inherit : inherit,
		initApp:initApp,
		context : context,
		global:global
	};
}();

/**
 * 用来在控制台打印消息
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
 * DisplayObject 类是可放在显示列表中的所有对象的基类
 * @param {Object} 配置一些属性
 */
function DisplayObject(config) {
	config = config || {};
	this._x = config.x || 0;
	this._y = config.y || 0;
	this.stageX = config.stageX || 0;
	this.stageY = config.stageY || 0;
	this._width = 0;
	this._height = 0;
	this.alpha = config.alpha || 1;
	this.scaleX = config.scaleX || 1;
	this.scaleY = config.scaleY || 1;
	this.visible = config.visible || true;
	this.rotation = config.rotation || 0;
	this.mask = null;
	this.id
	this.parent = null;
	Object.defineProperties(this, {
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
						this.stageX = this._x+this.parent.stageY;
					}
				}
			}
		}
	});
}

DisplayObject.prototype.getBounds = function() {
	//TO-DO
}

DisplayObject.prototype.getRect = function() {
	//TO-DO
}

DisplayObject.prototype.render = function() {

}
/**
 * Graphics 类包含一组可用来创建矢量形状的方法。 支持绘制的显示对象包括 Sprite 和 Shape 对象。
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
		this._steps.push();
		Flex.context.strokeStyle = color;
		Flex.context.lineWidth = weight;
		Flex.context.lineCap = lineCap;
	},
	drawRect : function(x, y, width, height) {
		Flex.context.fillRect(this.owner.stageX + x, this.owner.stageY + y, width, height);
	},
	drawCircle : function(x, y, radius) {
		Flex.context.beginPath();
		Flex.context.arc(this.owner.stageX + x, this.owner.stageY + y, radius, 0, Math.PI * 2, false);
		Flex.context.fill();
		Flex.context.stroke();
	},
	/**
	 *
	 */
	endFill : function() {
		Flex.context.restore();
	},
	lineTo : function(x, y) {
		Flex.context.lineTo(this.owner.stageX + x, this.owner.stageY + y);
	},
	moveTo : function(x, y) {
		Flex.context.moveTo(this.owner.stageX + x, this.owner.stageY + y);
	}
}

/**
 * 只用来绘制图形 不具有交互性
 */
function Shape(config) {
	DisplayObject.call(this, config);
	this._graphics = null;
	this._steps = [];//保存绘制的步骤和顺序
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
	trace("invoke");
}

/**
 * 显示列表的容器类
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
}


/**
 * 将一个 DisplayObject 子实例添加到该 DisplayObjectContainer 实例中。
 * @return {DisplayObject} 添加的实例
 */
DisplayObjectContainer.prototype.addChild = function(child) {
	if(this._children.indexOf(child) == -1) {
		this.validateProperties(child);
		this._children.push(child);
		child.parent = this;
	} else {
		trace("显示列表中已经存在了" + child + "对象实例", Log.ERROR)
	}
	return child;
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
}
/**
 * 将一个 DisplayObject 子实例添加到该 DisplayObjectContainer 实例中。
 * @param {DisplayObject} 要添加到显示列表中的显示对象
 * @param {Number} 要添加到的位置索引
 */
DisplayObjectContainer.prototype.addChildAt = function(child, index) {
	this._children.splice(index - 1, 0, child);
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

function Stage(config){
	DisplayObjectContainer.call(this,config);
}

Flex.inherit(Stage,DisplayObjectContainer);

/**
 * 线条的风格 静态常量
 */
var LineCap = {
	BUTT : 'butt', //每根线的头和尾都是长方形，也就是不做任何的处理，为默认值
	ROUND : 'round', //每根线的头和尾都增加一个半圆形的箭头
	SQUARE : "square"//每根线的头和尾都增加一个长方形，长度为线宽一半，高度为线宽
}

/**
 * 日志打印级别 常量
 */
var Log = {
	ERROR : 'error',
	INFO : 'info',
	WARN : 'warn'
}