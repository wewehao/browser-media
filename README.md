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

如果需要滤镜则需要引入 `lib/webdsp` 文件

```javascript
const Media = BrowserMedia({
  el: '.videoEl', // video挂载的节点
  type: 'image', // image || video
});
Media.open(); // 初始化

// 拍照 shot
$('.start').click(async () => {
  window.scrollTo({ top: 0 });
  const urlCreator = window.URL || window.webkitURL;
  const imageUrl = urlCreator.createObjectURL(await Media.shot());
  document.querySelector('#image-test').src = imageUrl;
  Media.close(); // 关闭录像状态
});

// 开始录像 startRecord
$('.startRecode').click(async () => {
  Media.setMediaType('video');
  Media.startRecord();
});

// 结束录像 stopRecord
$('.stopRecode').click(async () => {
  Media.stopRecord(blob => {
    document.querySelector('#video-test').src = blob;
  });
});

// 设置滤镜（拍照）
// 'Normal', 'Grayscale', 'Invert', 'Bacteria', 'Sunset', 'Emboss', 'Super Edge', 'Super Edge Inv', 'Gaussian Blur', 'Moss', 'Robbery', 'Brighten', 'Swamp', 'Ghost', 'Good Morning', 'Acid', 'Urple', 'Romance', 'Hippo', 'Longhorn', 'Security', 'Underground', 'Rooster', 'Mist', 'Tingle', 'Kaleidoscope', 'Noise', 'Forest', 'Dewdrops', 'Analog TV', 'Color Destruction', 'Hulk Edge', 'Twisted', 'Clarity', 'Sharpen', 'Uber Sharpen'
Media.setFilter('Invert');
```

在ES6模块中使用

```javascript
import 'browser-media'; // 注入全局对象 BrowserMedia
```

### Building

install dependencies:

`$ npm install`

Build browser bundle

`$ npm run build`
