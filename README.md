# browser-media

`browser-media` 提供了在浏览器环境下通过摄像头`拍照`和`录像`的`API`。

### Demo

浏览器下打开 [./src/index.html](./src/index.html) 页面。

### Usage

在html中直接引入JS文件后使用

```html
<div class="main">
  <div class="videoEl"></div>
</div>
```

`<script src="/dist/main.js"></script>`

```javascript
const Media = NdeMedia({
  el: '.videoEl', // video挂载的节点
  type: 'image' // image || video
})
Media.open();

$('.start').click(async () => {
  window.scrollTo({ top: 0 });
  const urlCreator = window.URL || window.webkitURL;
  const imageUrl = urlCreator.createObjectURL(await Media.shot());
  document.querySelector('#image-test').src = imageUrl;
});

$('.startRecode').click(async () => {
  Media.setMediaType('video');
  Media.startRecord();
});

$('.stopRecode').click(async () => {
  Media.stopRecord(blob => {
    document.querySelector('#video-test').src = blob;
  });
});
```

在ES6模块中使用

```javascript
import 'browser-media'; // 注入全局对象 NdeMedia
```

### Building

install dependencies:

`$ npm install`

Build browser bundle

`$ npm run build`
