/**
 * Javascript library for anvi'o genome view
 *
 *  Authors: Isaac Fink <iafink@uchicago.edu>
 *           Matthew Klein <mtt.l.kln@gmail.com>
 *           A. Murat Eren <a.murat.eren@gmail.com>
 *
 * Copyright 2021, The anvi'o project (http://anvio.org)
 *
 * Anvi'o is a free software. You can redistribute this program
 * and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 * along with anvi'o. If not, see <http://opensource.org/licenses/GPL-3.0>.
 *
 * @license GPL-3.0+ <http://opensource.org/licenses/GPL-3.0>
 */

/**
 * File Overview : This file contains utility functions used throughout genomeview. As a general rule, 
 * functions defined here explicitly return some value or mutate an existing global variable. Functions 
 * defined here should not interact directly with elements of UI, state, or canvas objects. 
 */


/** 
 * ripped from primary utils.js instead of importing the whole file
*/
var fixHelperModified = function(e, tr) { 
  var $originals = tr.children();
  var $helper = tr.clone();
  $helper.children().each(function(index) {
      $(this).width($originals.eq(index).width());
  });
  return $helper;
};

/*
 *  return height value for main canvas element
 */
function calculateMainCanvasHeight(){
  let additionalSpacing = 100 // arbitrary additional spacing for cosmetics
      let mainCanvasHeight =  spacing * genomeData.genomes.length + additionalSpacing
  return mainCanvasHeight
}

/*
 *  Save NT length of the largest genome in `genomeMax`.
 */
function calculateMaxGenomeLength(){
  for(genome of genomeData.genomes) {
    genome = genome[1].genes.gene_calls;
    let genomeEnd = genome[Object.keys(genome).length-1].stop;
    if(genomeEnd > genomeMax) genomeMax = genomeEnd;
  }
}

/*
 *  @returns [start, stop] nt range for the current viewport and scaleFactor
 */
function getNTRangeForVPT() {
  let vpt = canvas.viewportTransform;
  let window_left = Math.floor((-1*vpt[4]-xDisplacement)/scaleFactor);
  let window_right = Math.floor(window_left + canvas.getWidth()/scaleFactor);
  // if window is out of bounds, shift to be in bounds
  if(window_left < 0) {
    window_right -= window_left;
    window_left = 0;
  }
  if(window_right > genomeMax) {
    window_left -= (window_right - genomeMax);
    window_right = genomeMax;
  }
  return [window_left, window_right];
}

/*
 *  @returns [start, stop] proportional (0-1) range, used with scale for non-aligned genomes
 */
function getFracForVPT() {
  let resolution = 4; // number of decimals to show
  let [x1, x2] = calcXBounds();
  let window_left = Math.round(10**resolution * (-1*canvas.viewportTransform[4] - x1) / (x2 - x1)) / 10**resolution;
  let window_right = Math.round(10**resolution * (window_left + (canvas.getWidth()) / (x2 - x1))) / 10**resolution;
  // if window is out of bounds, shift to be in bounds
  if(window_left < 0) {
    window_right -= window_left;
    window_left = 0;
  }
  if(window_right > 1) {
    window_left -= (window_right - 1);
    window_right = 1;
  }
  return [window_left, window_right];
}

/*
 *  @returns range of renderWindow x-positions for a given proportional range
 */
function getRenderXRangeForFrac() {
  if(!percentScale) return null;
  let [l,r] = calcXBounds();
  let [x1, x2] = renderWindow.map(x => l+x*(r-l));
  return [x1, x2];
}

function getRenderNTRange(genomeID) {
  if(!percentScale) return renderWindow;
  let [l,r] = calcXBounds();
  let [start, end] = getRenderXRangeForFrac().map(x => (x-xDisps[genomeID])/scaleFactor);
  return [clamp(start,0,genomeMax), clamp(end,0,genomeMax)];
}

/*
 *  Resets viewport if outside bounds of the view window, with padding on each end
 */
function bindViewportToWindow() {
  let vpt = canvas.viewportTransform;
  let [l,r] = calcXBounds();
  if(vpt[4] > 250 - l) {
    vpt[4] = 250 - l;
  } else if(vpt[4] < canvas.getWidth() - r - 125) {
    vpt[4] = canvas.getWidth() - r - 125;
  }
}

function calcXBounds() {
  let min = 9*(10**9), max = -9*(10**9);
  for(let g in xDisps) {
    if(xDisps[g] > max) max = xDisps[g];
    if(xDisps[g] < min) min = xDisps[g];
  }
  return [min, max + scaleFactor*genomeMax];
}

function getCategoryForKEGGClass(class_str) {
  if(class_str == null) return null;

  var category_name = getClassFromKEGGAnnotation(class_str);
  return getKeyByValue(KEGG_categories, category_name);
}
  
function getClassFromKEGGAnnotation(class_str) {
  return class_str.substring(17, class_str.indexOf(';', 17));
}

// https://stackoverflow.com/questions/9907419/how-to-get-a-key-in-a-javascript-object-by-its-value/36705765
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}