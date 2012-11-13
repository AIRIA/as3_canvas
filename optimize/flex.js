var Flex = function(){
	var scaleX;//targetWidth/realWidth 构成的比例 用来缩放程序
	var scaleY;//targetHeight/realHeight
	var context;//canvas 上下文
	
	/**
	 * 在程序执行前必须 初始化程序
	 * @param {String} Dom中的Id
	 * @param {Number} 渲染的帧速 默认是24
	 */
	function initApp(canvasId,frameRate,targetWidth,targetHeight,realWidth,realHeight){
		var canvas = document.getElementById(canvasId);
		if(canvas.getContext){
			this.context = canvas.getContext("2d");
		}else{
			alert("Your Browser Doesn't Support HTML5 \nPlease Try Chrome,IE9+,FireFox3.6+,Opera10+ etc.");
		}
	}
	
	/**
	 * 继承使用的工具方法
	 * @param {Function} 子类
	 * @param {Function} 要继承的父类
	 */
	function inherit(subClass,supClass){
		subClass.prototype = new supClass;
		subClass.prototype.constructor = subClass;
	}
	
	return {
		inherit:inherit,
		context:context
	};
}();

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

/**
 * DisplayObject 类是可放在显示列表中的所有对象的基类
 * @param {Object} 配置一些属性
 */
function DisplayObject(config){
	config = config || {};
	this.x = config.x || 0;
	this.y = config.y || 0;
	this._width = 0;
	this._height = 0;
	this.alpha = config.alpha || 1;
	this.scaleX = config.scaleX || 1;
	this.scaleY = config.scaleY || 1;
	this.visible = config.visible || true;
	this.rotation = config.rotation || 0;
	this.mask = null;
	this.id;
	this.parent = null;
	Object.defineProperties(this,{
		width:{
			get:function(){
				return this._width;
			},
			set:function(value){
				if(this._width!=value){
					this._width = value;
				}
			}
		},
		height:{
			get:function(){
				return this._height;
			},
			set:function(value){
				if(this._height!=value){
					this._height = value;
				}
			}
		}
	});
}

DisplayObject.prototype.getBounds = function(){
	//TO-DO
}

DisplayObject.prototype.getRect = function(){
	//TO-DO
}

DisplayObject.prototype.render = function(){
	
}
