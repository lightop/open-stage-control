var {clip, mapToScale} = require('../utils'),
    Slider = require('./slider')

module.exports = class Knob extends Slider {

    static defaults() {

        return {
            type:'knob',
            id:'auto',
            linkId:'',

            _geometry:'geometry',

            left:'auto',
            top:'auto',
            width:'auto',
            height:'auto',

            _style:'style',

            label:'auto',
            color:'auto',
            css:'',

            _knob:'knob',

            pips:true,
            input: true,
            dashed:false,
            angle:270,
            snap:false,
            spring:false,
            doubleTap:false,
            range:{min:0,max:1},
            logScale:false,
            unit:'',
            origin: 'auto',

            _value: 'value',
            default: '',
            value: '',

            _osc:'osc',

            precision:2,
            address:'auto',
            touchAddress:'',
            preArgs:[],
            target:[],
            bypass:false
        }

    }

    constructor(options) {

        super(options)

        this.widget.classList.add('knob')

        this.widget.classList.add('compact')

        this.lastOffsetX = 0
        this.lastOffsetY = 0
        this.minDimension = 0

        this.maxAngle = this.getProp('angle')

        // calculate lost height factor
        var a = (1 - Math.sin((Math.max(this.maxAngle,247.5) - 180) / 2 * Math.PI / 180)) / 3
        this.lostHeightFactor = a / 4

    }

    draginitHandle(e) {

        this.percent = clip(this.percent,[0,100])

        this.lastOffsetX = e.offsetX
        this.lastOffsetY = e.offsetY

        if (!(e.traversing || this.getProp('snap'))  || e.ctrlKey) return

        this.percent = this.angleToPercent(this.coordsToAngle(e.offsetX, e.offsetY))

        this.setValue(this.percentToValue(this.percent), {send:true,sync:true,dragged:true})

    }

    dragHandle(e) {

        if (!(e.traversing || this.getProp('snap')) || e.ctrlKey) {

            this.percent = -100 * (e.movementY / e.inertia) / this.height + this.percent

        } else {

            this.lastOffsetX = this.lastOffsetX + e.movementX / e.inertia
            this.lastOffsetY = this.lastOffsetY + e.movementY / e.inertia
            this.percent = this.angleToPercent(this.coordsToAngle(this.lastOffsetX, this.lastOffsetY))
        }

        this.percent = this.percent,[0,100]

        this.setValue(this.percentToValue(this.percent), {send:true,sync:true,dragged:true})

    }

    coordsToAngle(x,y) {

        var xToCenter = x - this.width /2,
            yToCenter = y - this.height / 2,
            angle =  Math.atan2(-yToCenter, -xToCenter) * 180 / Math.PI + 90

        return angle<0?360+angle:angle

    }

    angleToPercent(angle) {

        return clip(angle - (360 - this.maxAngle) / 2, [0, this.maxAngle]) / this.maxAngle * 100

    }

    percentToAngle(percent) {

        var percent = clip(percent, [0, 100])
        return  2 * Math.PI * percent / 100 * (this.maxAngle / 360) // angle relative to maxAngle
                + Math.PI / 2                                       // quarter circle offset
                + Math.PI * (1 - this.maxAngle / 360)               // centering offset depending on maxAngle

    }

    resizeHandle() {

        super.resizeHandle(...arguments)

        this.minDimension = Math.min(this.width, this.height)

        this.wrapper.style.top = (this.minDimension) * this.lostHeightFactor - (this.getProp('label') === false ? 0 : this.gaugeWidth / 4) + 'px'

    }

    draw() {

        var o = this.percentToAngle(this.valueToPercent(this.originValue)),
            d = this.percentToAngle(this.percent),
            min = this.percentToAngle(0),
            max = this.percentToAngle(100),
            dashed = this.getProp('dashed'),
            pips = this.getProp('pips'),
            gaugeWidth = Math.max(7 * PXSCALE, this.minDimension / 20),
            gaugeRadius = this.minDimension / 2 - gaugeWidth / 2 - 2 * PXSCALE,
            knobRadius = gaugeRadius - gaugeWidth,
            rad = PXSCALE /  gaugeRadius / 2


        this.ctx.clearRect(0,0,this.width,this.height)

        this.ctx.globalAlpha = 1

        this.ctx.strokeStyle = this.colors.light
        this.ctx.lineWidth = gaugeWidth
        this.ctx.beginPath()
        this.ctx.arc(this.width / 2, this.height / 2, gaugeRadius, min - 4 * rad - (pips ? 3 * rad : 0), max + 4 * rad + (pips ? 3 * rad : 0))
        this.ctx.stroke()

        this.ctx.strokeStyle = this.colors.bg
        this.ctx.lineWidth = gaugeWidth - 2 * PXSCALE
        this.ctx.beginPath()
        this.ctx.arc(this.width / 2, this.height / 2, gaugeRadius, min - 2 * rad, max + 2 * rad)
        this.ctx.stroke()

        if (dashed) this.ctx.setLineDash([1.5 * PXSCALE, 1.5 * PXSCALE])

        this.ctx.strokeStyle = this.colors.track
        this.ctx.lineWidth = gaugeWidth - 4.5 * PXSCALE
        this.ctx.beginPath()
        this.ctx.arc(this.width / 2, this.height / 2, gaugeRadius, min, max)
        this.ctx.stroke()

        this.ctx.globalAlpha = pips ? 0.5 : 0.7
        this.ctx.strokeStyle = this.colors.gauge
        this.ctx.lineWidth = gaugeWidth - 4.5 * PXSCALE
        this.ctx.beginPath()

        this.ctx.arc(this.width / 2, this.height / 2, gaugeRadius, o, d, o > d)
        this.ctx.stroke()

        if (dashed) this.ctx.setLineDash([])


        if (pips) {

            this.ctx.globalAlpha = 1
            this.ctx.lineWidth = gaugeWidth - 4.5 * PXSCALE

            for (var pip of this.rangeKeys.concat(this.valueToPercent(this.originValue))) {

                let a = this.percentToAngle(pip)

                this.ctx.lineWidth = gaugeWidth - 2 * PXSCALE
                this.ctx.strokeStyle = this.colors.bg
                this.ctx.beginPath()
                this.ctx.arc(this.width / 2, this.height / 2, gaugeRadius, a - 5 * rad, a + 5 * rad)
                this.ctx.stroke()

                this.ctx.lineWidth = gaugeWidth - 4.5 * PXSCALE
                this.ctx.strokeStyle = this.colors.pips
                this.ctx.beginPath()
                this.ctx.arc(this.width / 2, this.height / 2, gaugeRadius, a - 2 * rad, a + 2 * rad)
                this.ctx.stroke()

            }

        }

        // knob

        this.ctx.lineWidth = PXSCALE

        this.ctx.fillStyle = this.colors.raised
        this.ctx.beginPath()
        this.ctx.globalAlpha = 1
        this.ctx.arc(this.width / 2, this.height / 2,  knobRadius, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.strokeStyle = this.colors.bg
        this.ctx.stroke()

        this.ctx.beginPath()
        this.ctx.globalAlpha = 1
        this.ctx.arc(this.width / 2, this.height / 2,  knobRadius - PXSCALE * 1.5, 0, Math.PI * 2)
        this.ctx.strokeStyle = this.colors.light
        this.ctx.stroke()

        var g = this.ctx.createLinearGradient(this.width / 2, this.height / 2 - knobRadius / 2,this.width / 2,  this.height / 2 + knobRadius / 2)
        g.addColorStop(0.5, 'transparent')
        g.addColorStop(0, this.colors.light || 'transparent')

        this.ctx.strokeStyle = g
        this.ctx.stroke()

        // cursor
        this.ctx.globalAlpha = 1

        let r1 = knobRadius - PXSCALE,
            r2 = knobRadius / 4,
            a  = 2 * Math.PI - d

        this.ctx.beginPath()
        this.ctx.moveTo(r1 * Math.cos(a) + this.width / 2, this.height / 2 - r1 * Math.sin(a))
        this.ctx.lineTo(r2 * Math.cos(a) + this.width / 2, this.height / 2 - r2 * Math.sin(a))

        this.ctx.lineWidth = gaugeWidth - 4.5 * PXSCALE
        this.ctx.strokeStyle = this.colors.knob
        this.ctx.stroke()

    }

}
