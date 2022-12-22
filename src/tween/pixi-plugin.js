// @ts-nocheck

/*!
 * Dit is een aangepaste kopie van de plugin met ondersteuning voor mixins
 *
 * PixiPlugin 3.11.1
 * https://greensock.com
 *
 * @license Copyright 2008-2022, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
 */

import { hasMixin } from 'ts-mixer';

let gsap,
  _win,
  _splitColor,
  _coreInitted,
  _PIXI,
  PropertyTween,
  _getSetter,
  _isV4,
  _windowExists = () => typeof window !== 'undefined',
  _getGSAP = () => gsap || (_windowExists() && (gsap = window.gsap) && gsap.registerPlugin && gsap),
  _isFunction = (value) => typeof value === 'function',
  _warn = (message) => console.warn(message),
  _idMatrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  _lumR = 0.212_671,
  _lumG = 0.715_16,
  _lumB = 0.072_169,
  _applyMatrix = (m, m2) => {
    let temporary = [],
      index = 0,
      z = 0,
      y,
      x;
    for (y = 0; y < 4; y++) {
      for (x = 0; x < 5; x++) {
        z = x === 4 ? m[index + 4] : 0;
        temporary[index + x] = m[index] * m2[x] + m[index + 1] * m2[x + 5] + m[index + 2] * m2[x + 10] + m[index + 3] * m2[x + 15] + z;
      }
      index += 5;
    }
    return temporary;
  },
  _setSaturation = (m, n) => {
    let inv = 1 - n,
      r = inv * _lumR,
      g = inv * _lumG,
      b = inv * _lumB;
    return _applyMatrix([r + n, g, b, 0, 0, r, g + n, b, 0, 0, r, g, b + n, 0, 0, 0, 0, 0, 1, 0], m);
  },
  _colorize = (m, color, amount) => {
    let c = _splitColor(color),
      r = c[0] / 255,
      g = c[1] / 255,
      b = c[2] / 255,
      inv = 1 - amount;
    return _applyMatrix(
      [
        inv + amount * r * _lumR,
        amount * r * _lumG,
        amount * r * _lumB,
        0,
        0,
        amount * g * _lumR,
        inv + amount * g * _lumG,
        amount * g * _lumB,
        0,
        0,
        amount * b * _lumR,
        amount * b * _lumG,
        inv + amount * b * _lumB,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
      ],
      m,
    );
  },
  _setHue = (m, n) => {
    n *= Math.PI / 180;
    let c = Math.cos(n),
      s = Math.sin(n);
    return _applyMatrix(
      [
        _lumR + c * (1 - _lumR) + s * -_lumR,
        _lumG + c * -_lumG + s * -_lumG,
        _lumB + c * -_lumB + s * (1 - _lumB),
        0,
        0,
        _lumR + c * -_lumR + s * 0.143,
        _lumG + c * (1 - _lumG) + s * 0.14,
        _lumB + c * -_lumB + s * -0.283,
        0,
        0,
        _lumR + c * -_lumR + s * -(1 - _lumR),
        _lumG + c * -_lumG + s * _lumG,
        _lumB + c * (1 - _lumB) + s * _lumB,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        1,
      ],
      m,
    );
  },
  _setContrast = (m, n) => _applyMatrix([n, 0, 0, 0, 0.5 * (1 - n), 0, n, 0, 0, 0.5 * (1 - n), 0, 0, n, 0, 0.5 * (1 - n), 0, 0, 0, 1, 0], m),
  _getFilter = (target, type) => {
    let filterClass = _PIXI.filters[type],
      filters = target.filters || [],
      index = filters.length,
      filter;
    filterClass || _warn(`${type} not found. PixiPlugin.registerPIXI(PIXI)`);
    while (--index > -1) {
      if (filters[index] instanceof filterClass) {
        return filters[index];
      }
    }
    filter = new filterClass();
    if (type === 'BlurFilter') {
      filter.blur = 0;
    }
    filters.push(filter);
    target.filters = filters;
    return filter;
  },
  _addColorMatrixFilterCacheTween = (p, plugin, cache, variables) => {
    //we cache the ColorMatrixFilter components in a _gsColorMatrixFilter object attached to the target object so that it's easy to grab the current value at any time.
    plugin.add(cache, p, cache[p], variables[p]);
    plugin._props.push(p);
  },
  _applyBrightnessToMatrix = (brightness, matrix) => {
    let temporary = new _PIXI.filters.ColorMatrixFilter();
    temporary.matrix = matrix;
    temporary.brightness(brightness, true);
    return temporary.matrix;
  },
  _copy = (object) => {
    let copy = {},
      p;
    for (p in object) {
      copy[p] = object[p];
    }
    return copy;
  },
  _CMFdefaults = { contrast: 1, saturation: 1, colorizeAmount: 0, colorize: 'rgb(255,255,255)', hue: 0, brightness: 1 },
  _parseColorMatrixFilter = (target, v, pg) => {
    let filter = _getFilter(target, 'ColorMatrixFilter'),
      cache = (target._gsColorMatrixFilter = target._gsColorMatrixFilter || _copy(_CMFdefaults)),
      combine = v.combineCMF && !('colorMatrixFilter' in v && !v.colorMatrixFilter),
      index,
      matrix,
      startMatrix;
    startMatrix = filter.matrix;
    if (v.resolution) {
      filter.resolution = v.resolution;
    }
    if (v.matrix && v.matrix.length === startMatrix.length) {
      matrix = v.matrix;
      if (cache.contrast !== 1) {
        _addColorMatrixFilterCacheTween('contrast', pg, cache, _CMFdefaults);
      }
      if (cache.hue) {
        _addColorMatrixFilterCacheTween('hue', pg, cache, _CMFdefaults);
      }
      if (cache.brightness !== 1) {
        _addColorMatrixFilterCacheTween('brightness', pg, cache, _CMFdefaults);
      }
      if (cache.colorizeAmount) {
        _addColorMatrixFilterCacheTween('colorize', pg, cache, _CMFdefaults);
        _addColorMatrixFilterCacheTween('colorizeAmount', pg, cache, _CMFdefaults);
      }
      if (cache.saturation !== 1) {
        _addColorMatrixFilterCacheTween('saturation', pg, cache, _CMFdefaults);
      }
    } else {
      matrix = [..._idMatrix];
      if (v.contrast != undefined) {
        matrix = _setContrast(matrix, +v.contrast);
        _addColorMatrixFilterCacheTween('contrast', pg, cache, v);
      } else if (cache.contrast !== 1) {
        if (combine) {
          matrix = _setContrast(matrix, cache.contrast);
        } else {
          _addColorMatrixFilterCacheTween('contrast', pg, cache, _CMFdefaults);
        }
      }
      if (v.hue != undefined) {
        matrix = _setHue(matrix, +v.hue);
        _addColorMatrixFilterCacheTween('hue', pg, cache, v);
      } else if (cache.hue) {
        if (combine) {
          matrix = _setHue(matrix, cache.hue);
        } else {
          _addColorMatrixFilterCacheTween('hue', pg, cache, _CMFdefaults);
        }
      }
      if (v.brightness != undefined) {
        matrix = _applyBrightnessToMatrix(+v.brightness, matrix);
        _addColorMatrixFilterCacheTween('brightness', pg, cache, v);
      } else if (cache.brightness !== 1) {
        if (combine) {
          matrix = _applyBrightnessToMatrix(cache.brightness, matrix);
        } else {
          _addColorMatrixFilterCacheTween('brightness', pg, cache, _CMFdefaults);
        }
      }
      if (v.colorize != undefined) {
        v.colorizeAmount = 'colorizeAmount' in v ? +v.colorizeAmount : 1;
        matrix = _colorize(matrix, v.colorize, v.colorizeAmount);
        _addColorMatrixFilterCacheTween('colorize', pg, cache, v);
        _addColorMatrixFilterCacheTween('colorizeAmount', pg, cache, v);
      } else if (cache.colorizeAmount) {
        if (combine) {
          matrix = _colorize(matrix, cache.colorize, cache.colorizeAmount);
        } else {
          _addColorMatrixFilterCacheTween('colorize', pg, cache, _CMFdefaults);
          _addColorMatrixFilterCacheTween('colorizeAmount', pg, cache, _CMFdefaults);
        }
      }
      if (v.saturation != undefined) {
        matrix = _setSaturation(matrix, +v.saturation);
        _addColorMatrixFilterCacheTween('saturation', pg, cache, v);
      } else if (cache.saturation !== 1) {
        if (combine) {
          matrix = _setSaturation(matrix, cache.saturation);
        } else {
          _addColorMatrixFilterCacheTween('saturation', pg, cache, _CMFdefaults);
        }
      }
    }
    index = matrix.length;
    while (--index > -1) {
      if (matrix[index] !== startMatrix[index]) {
        pg.add(startMatrix, index, startMatrix[index], matrix[index], 'colorMatrixFilter');
      }
    }
    pg._props.push('colorMatrixFilter');
  },
  _renderColor = (ratio, { t, p, color, set }) => {
    set(t, p, (color[0] << 16) | (color[1] << 8) | color[2]);
  },
  _renderDirtyCache = (ratio, { g }) => {
    if (g) {
      //in order for PixiJS to actually redraw GraphicsData, we've gotta increment the "dirty" and "clearDirty" values. If we don't do this, the values will be tween properly, but not rendered.
      g.dirty++;
      g.clearDirty++;
    }
  },
  _renderAutoAlpha = (ratio, data) => {
    data.t.visible = !!data.t.alpha;
  },
  _addColorTween = (target, p, value, plugin) => {
    let currentValue = target[p],
      startColor = _splitColor(
        _isFunction(currentValue) ? target[p.indexOf('set') || !_isFunction(target[`get${p.slice(3)}`]) ? p : `get${p.slice(3)}`]() : currentValue,
      ),
      endColor = _splitColor(value);
    plugin._pt = new PropertyTween(plugin._pt, target, p, 0, 0, _renderColor, { t: target, p: p, color: startColor, set: _getSetter(target, p) });
    plugin.add(startColor, 0, startColor[0], endColor[0]);
    plugin.add(startColor, 1, startColor[1], endColor[1]);
    plugin.add(startColor, 2, startColor[2], endColor[2]);
  },
  _colorProperties = { tint: 1, lineColor: 1, fillColor: 1 },
  _xyContexts = 'position,scale,skew,pivot,anchor,tilePosition,tileScale'.split(','),
  _contexts = { x: 'position', y: 'position', tileX: 'tilePosition', tileY: 'tilePosition' },
  _colorMatrixFilterProperties = { colorMatrixFilter: 1, saturation: 1, contrast: 1, hue: 1, colorize: 1, colorizeAmount: 1, brightness: 1, combineCMF: 1 },
  _DEG2RAD = Math.PI / 180,
  _isString = (value) => typeof value === 'string',
  _degreesToRadians = (value) =>
    _isString(value) && value.charAt(1) === '=' ? value.slice(0, 2) + Number.parseFloat(value.slice(2)) * _DEG2RAD : value * _DEG2RAD,
  _renderPropertyWithEnd = (ratio, data) => data.set(data.t, data.p, ratio === 1 ? data.e : Math.round((data.s + data.c * ratio) * 100_000) / 100_000, data),
  _addRotationalPropertyTween = (plugin, target, property, startNumber, endValue, radians) => {
    let cap = 360 * (radians ? _DEG2RAD : 1),
      isString = _isString(endValue),
      relative = isString && endValue.charAt(1) === '=' ? +`${endValue.charAt(0)}1` : 0,
      endNumber = Number.parseFloat(relative ? endValue.slice(2) : endValue) * (radians ? _DEG2RAD : 1),
      change = relative ? endNumber * relative : endNumber - startNumber,
      finalValue = startNumber + change,
      direction,
      pt;
    if (isString) {
      direction = endValue.split('_')[1];
      if (direction === 'short') {
        change %= cap;
        if (change !== change % (cap / 2)) {
          change += change < 0 ? cap : -cap;
        }
      }
      if (direction === 'cw' && change < 0) {
        change = ((change + cap * 1e10) % cap) - Math.trunc(change / cap) * cap;
      } else if (direction === 'ccw' && change > 0) {
        change = ((change - cap * 1e10) % cap) - Math.trunc(change / cap) * cap;
      }
    }
    plugin._pt = pt = new PropertyTween(plugin._pt, target, property, startNumber, change, _renderPropertyWithEnd);
    pt.e = finalValue;
    return pt;
  },
  _initCore = () => {
    if (_windowExists()) {
      _win = window;
      gsap = _getGSAP();
      _PIXI = _coreInitted = _PIXI || _win.PIXI;
      _isV4 = _PIXI && _PIXI.VERSION && _PIXI.VERSION.charAt(0) === '4';
      _splitColor = (color) => gsap.utils.splitColor(`${color}`.slice(0, 2) === '0x' ? `#${color.slice(2)}` : color); // some colors in PIXI are reported as "0xFF4421" instead of "#FF4421".
    }
  },
  index,
  p;

//context setup...
for (index = 0; index < _xyContexts.length; index++) {
  p = _xyContexts[index];
  _contexts[`${p}X`] = p;
  _contexts[`${p}Y`] = p;
}

export const PixiPlugin = {
  version: '3.11.1',
  name: 'pixi',
  register(core, Plugin, propertyTween) {
    gsap = core;
    PropertyTween = propertyTween;
    _getSetter = Plugin.getSetter;
    _initCore();
  },
  registerPIXI(pixi) {
    _PIXI = pixi;
  },
  init(target, values, tween, index, targets) {
    _PIXI || _initCore();
    // aangepast door martijn@studiokloek.nl om mixins te ondersteunen
    if (!_PIXI || (!(target instanceof _PIXI.DisplayObject) && !hasMixin(target, _PIXI.DisplayObject))) {
      console.error(target, 'is not a DisplayObject or PIXI was not found. PixiPlugin.registerPIXI(PIXI);');
      return false;
    }
    let context, axis, value, colorMatrix, filter, p, padding, index_, data;
    for (p in values) {
      context = _contexts[p];
      value = values[p];
      if (context) {
        axis = ~p
          .charAt(p.length - 1)
          .toLowerCase()
          .indexOf('x')
          ? 'x'
          : 'y';
        this.add(target[context], axis, target[context][axis], context === 'skew' ? _degreesToRadians(value) : value, 0, 0, 0, 0, 0, 1);
      } else if (p === 'scale' || p === 'anchor' || p === 'pivot' || p === 'tileScale') {
        this.add(target[p], 'x', target[p].x, value);
        this.add(target[p], 'y', target[p].y, value);
      } else if (p === 'rotation' || p === 'angle') {
        //PIXI expects rotation in radians, but as a convenience we let folks define it in degrees and we do the conversion.
        _addRotationalPropertyTween(this, target, p, target[p], value, p === 'rotation');
      } else if (_colorMatrixFilterProperties[p]) {
        if (!colorMatrix) {
          _parseColorMatrixFilter(target, values.colorMatrixFilter || values, this);
          colorMatrix = true;
        }
      } else if (p === 'blur' || p === 'blurX' || p === 'blurY' || p === 'blurPadding') {
        filter = _getFilter(target, 'BlurFilter');
        this.add(filter, p, filter[p], value);
        if (values.blurPadding !== 0) {
          padding = values.blurPadding || Math.max(filter[p], value) * 2;
          index_ = target.filters.length;
          while (--index_ > -1) {
            target.filters[index_].padding = Math.max(target.filters[index_].padding, padding); //if we don't expand the padding on all the filters, it can look clipped.
          }
        }
      } else if (_colorProperties[p]) {
        if ((p === 'lineColor' || p === 'fillColor') && target instanceof _PIXI.Graphics) {
          data = (target.geometry || target).graphicsData; //"geometry" was introduced in PIXI version 5
          this._pt = new PropertyTween(this._pt, target, p, 0, 0, _renderDirtyCache, { g: target.geometry || target });
          index_ = data.length;
          while (--index_ > -1) {
            _addColorTween(_isV4 ? data[index_] : data[index_][`${p.slice(0, 4)}Style`], _isV4 ? p : 'color', value, this);
          }
        } else {
          _addColorTween(target, p, value, this);
        }
      } else if (p === 'autoAlpha') {
        this._pt = new PropertyTween(this._pt, target, 'visible', 0, 0, _renderAutoAlpha);
        this.add(target, 'alpha', target.alpha, value);
        this._props.push('alpha', 'visible');
      } else if (p !== 'resolution') {
        this.add(target, p, 'get', value);
      }
      this._props.push(p);
    }
  },
};

_getGSAP() && gsap.registerPlugin(PixiPlugin);

export { PixiPlugin as default };