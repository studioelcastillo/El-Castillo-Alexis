<template>
  <div style="width: 100%;">
    <div class="barra-container">
      <div class="delimitador-labels">
        <div
          v-for="(label, index) in segments.filter((_, index) => index % 2 === 0)"
          :key="'label-' + index"
          class="label-delimitador"
          :style="{ left: getDelimitadorLeft(index*2, label.labelLimitter.length) + '%' }"
        >
          {{ label.labelLimitter }}
        </div>
      </div>
      <div class="barra-segmentada">
        <div
          v-for="(segment, index) in segments"
          :key="'segment-' + index"
          class="segmento"
          :style="{
            width: getSegmentWidth(index) + '%',
            backgroundColor: segment.color,
            color: segment.color === '#FFDFB9' ? '#000' : '#fff',
            cursor: 'pointer'
          }"
          @click="$emit('edit-item', index)"
        >
          <span class="texto">{{ segment.label }}</span>
          <div
            v-if="index < segments.length - 1"
            class="delimitador"
          ></div>
        </div>
      </div>
      <div class="delimitador-labels2">
        <div
          v-for="(label, index) in segments.filter((_, index) => index % 2 !== 0)"
          :key="'label-2' + index"
          class="label-delimitador"
          :style="{ left: getDelimitadorLeft(index*2+1, label.labelLimitter.length) + '%' }"
        >
          {{ label.labelLimitter }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    segments: {
      type: Array,
      default: () => [] //{ percentage: 40, color: '#21ba45', label: '$0', labelLimitter: '$0' },
    }
  },
  methods: {
    getTotal () {
      return this.segments.reduce((sum, s) => sum + s.percentage, 0)
    },
    getSegmentWidth(index) {
      return (this.segments[index].percentage / this.getTotal()) * 100
    },
    getDelimitadorLeft(index, labelLength) {
      const total = this.getTotal()
      const before = this.segments
        .slice(0, index)
        .reduce((sum, s) => sum + s.percentage, 0)
      return (before / total) * 100
    }
  }
}
</script>

<style scoped>
.barra-container {
  position: relative;
  padding-top: 30px; /* espacio para los labels */
  width: 100%;
  margin: auto;
}

.barra-segmentada {
  display: flex;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ccc;
  background: #eee;
  width: 100%;
}

.segmento {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  height: 100%;
}

.texto {
  z-index: 2;
  padding: 0 6px;
  white-space: nowrap;
  text-align: center;
}

.delimitador {
  position: absolute;
  right: 0;
  top: 0;
  width: 2px;
  height: 100%;
  background-color: white;
  z-index: 5;
}

.delimitador-labels {
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
}
.delimitador-labels2 {
  margin-top: 5px;
  height: 30px;
}

.label-delimitador {
  position: absolute;
  transform: translateX(0%);
  background: white;
  color: #333;
  padding: 2px 6px;
  font-size: 20px;
  border-radius: 4px;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
</style>
