`0.0.1` 使用 `html2canvas` 实现拍摄框等比图片输出。但拍摄速度较慢，打包体积较大。

`0.0.2` 去掉 `html2canvas`，加入 `web-dsp` 拍照滤镜。

`0.0.3` 提供 `close` 方法关闭视频状态。

`0.0.4` 提供 `autoClose` 选项，在拍照后和录制结束后关闭流媒体。`stopRecord` 方法提供第二个参数 `videoResuleType` 为'file'时返回file对象，否则返回blob。
