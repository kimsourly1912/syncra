<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Hls from 'hls.js'
const config = useRuntimeConfig()
const src = `${config.public.awsS3Url}/public/videos/intro/master.m3u8`
const thumbnail = '/img/originals/syncra-thumbnail.png'

const videoRef = ref(null)
let player = null
let hls = null

onMounted(async () => {
  if (import.meta.client && videoRef.value) {
    const Plyr = (await import('plyr')).default
    await import('plyr/dist/plyr.css')

    // HLS Integration
    if (Hls.isSupported()) {
      hls = new Hls()
      hls.loadSource(src)
      hls.attachMedia(videoRef.value)
    }
    else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari (native HLS support)
      videoRef.value.src = src
    }
    else {
      // Fallback (e.g., if HLS not supported and not Safari)
      // You might want to provide the original MP4 here as fallback
      // videoRef.value.src = 'original.mp4'
    }

    player = new Plyr(videoRef.value, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'fullscreen',
      ],
      autoplay: false,
      muted: false,
      loop: { active: true },
      clickToPlay: true,
      hideControls: true,
      resetOnEnd: false,
      keyboard: { focused: true, global: false },
      tooltips: { controls: false, seek: true },
      invertTime: false,
      fullscreen: {
        enabled: true,
        fallback: true,
        iosNative: true,
      },
    })

    // Toggle center button icon between play and pause
    const updateBigPlayButton = () => {
      const container = videoRef.value?.closest('.plyr-container')
      if (!container) return

      const icon = container.querySelector('.plyr__control--overlaid svg use')
      if (!icon) return

      // Plyr uses both href and xlink:href sometimes, update both to be safe or just standard href
      // The ID usually changes from #plyr-play to #plyr-pause
      const targetIcon = player.playing ? '#plyr-pause' : '#plyr-play'

      icon.setAttribute('href', targetIcon)
      icon.setAttribute('xlink:href', targetIcon)
    }

    player.on('play', updateBigPlayButton)
    player.on('pause', updateBigPlayButton)
    // Also update on seek or other state changes if needed, but play/pause covers most
    player.on('ended', () => {
      const container = videoRef.value?.closest('.plyr-container')
      const icon = container?.querySelector('.plyr__control--overlaid svg use')
      if (icon) {
        icon.setAttribute('href', '#plyr-play')
        icon.setAttribute('xlink:href', '#plyr-play')
      }
    })
  }
})

onBeforeUnmount(() => {
  if (player) {
    player.destroy()
  }
  if (hls) {
    hls.destroy()
  }
})
</script>

<template>
  <div class="plyr-container w-full aspect-video rounded-lg overflow-hidden">
    <video
      ref="videoRef"
      playsinline
      crossorigin="anonymous"
      :poster="thumbnail"
    >
      <source
        :src="src"
        type="video/mp4"
      >
    </video>
  </div>
</template>

<style>
.plyr-container {
  --plyr-color-main: rgba(255, 255, 255, 0.9);
  --plyr-video-control-color: rgba(255, 255, 255, 0.9);
  --plyr-video-control-color-hover: #fff;
  --plyr-video-control-background-hover: transparent;
  --plyr-range-fill-background: rgba(255, 255, 255, 0.9);
  --plyr-video-progress-buffered-background: rgba(255, 255, 255, 0.3);
  --plyr-range-track-background: rgba(255, 255, 255, 0.3);
  --plyr-range-thumb-background: #fff;
  --plyr-range-thumb-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  --plyr-control-spacing: 10px;
  --plyr-video-controls-background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}

.plyr__video-wrapper {
  background-color: transparent !important;
}

.plyr-container .plyr {
  width: 100%;
  height: 100%;
  /* border-radius: 0.5rem; */
  overflow: hidden;
}

.plyr-container .plyr video {
  object-fit: cover;
}

.plyr-container .plyr__poster {
  background-size: cover !important;
  background-position: center !important;
}

/* Large play button - professional glass look */
.plyr-container .plyr__control--overlaid {
  /* background: rgba(0, 0, 0, 0.5); */
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 20px;
  /* border-radius: 50%; */
  opacity: 1;
  transition: all 0.2s ease;
}

.plyr-container .plyr__control--overlaid:hover {
  background: rgba(0, 0, 0, 0.7);
  border-color: #fff;
  /* transform: scale(1.05); */
}

.plyr-container .plyr__control--overlaid svg {
  width: 24px;
  height: 24px;
  left: 2px;
  position: relative;
}

/* Control bar styling */
.plyr-container .plyr__controls {
  padding: 10px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}

/* Control buttons */
.plyr-container .plyr__control {
  padding: 12px;
  border-radius: 50%;
  transition: background-color 0.15s ease;
}

.plyr-container .plyr__control:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.plyr-container .plyr__control svg {
  width: 20px;
  height: 20px;
}

/* Progress/seek bar */
.plyr-container .plyr__progress__container {
  flex: 1;
}

.plyr-container .plyr__progress input[type="range"] {
  height: 4px;
}

.plyr-container .plyr__progress input[type="range"]::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  background: #fff;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s ease;
}

.plyr-container .plyr__progress input[type="range"]:hover::-webkit-slider-thumb {
  transform: scale(1.2);
}

.plyr-container .plyr__progress__buffer,
.plyr-container .plyr__progress .plyr__tooltip {
  background: rgba(255, 255, 255, 0.3);
}

/* Time display */
.plyr-container .plyr__time {
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  color: rgba(255, 255, 255, 0.85);
  font-variant-numeric: tabular-nums;
}

/* Volume slider */
.plyr-container .plyr__volume {
  min-width: 80px;
  max-width: 100px;
}

.plyr-container .plyr__volume input[type="range"] {
  height: 4px;
}

/* Tooltip */
.plyr-container .plyr__tooltip {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  font-size: 12px;
  padding: 4px 8px;
  /* border-radius: 4px; */
}

/* Touch-friendly adjustments */
@media (pointer: coarse) {
  .plyr-container .plyr__control--overlaid {
    padding: 24px;
  }

  .plyr-container .plyr__control--overlaid svg {
    width: 28px;
    height: 28px;
  }

  .plyr-container .plyr__controls {
    padding: 12px 16px;
  }

  .plyr-container .plyr__control {
    padding: 10px;
  }

  /* Hide the volume SLIDER (input) only, keep the container if it holds the mute button */
  .plyr-container .plyr__volume input[type="range"] {
    display: none !important;
  }

  /* Ensure the volume container itself is visible (in case it wraps the button) */
  .plyr-container .plyr__volume {
    display: flex !important;
    min-width: auto !important; /* Allow it to shrink to just the button width */
    width: auto !important;
  }

  /* FORCE show the Mute/Unmute BUTTON so user can hear audio */
  .plyr-container .plyr__controls [data-plyr="mute"] {
    display: block !important;
  }

  .plyr-container .plyr__progress input[type="range"] {
    height: 6px;
  }
}

/* Ensure overlaid control is visible when controls are shown (sync with control bar) */
.plyr-container .plyr--playing:not(.plyr--hide-controls) .plyr__control--overlaid {
  opacity: 1;
  visibility: visible;
}

/* Fix alignment for pause icon (remove the play icon offset) */
.plyr-container .plyr--playing .plyr__control--overlaid svg {
  left: 0;
}
</style>
