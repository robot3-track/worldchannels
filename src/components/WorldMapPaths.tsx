// Simplified SVG path data for major landmasses on a 1000x500 map coordinate canvas.
// This is an Equirectangular projection layout mapping 1-to-1 with lat/long conversion formulas.

export interface ContinentPath {
  name: string;
  d: string;
}

export const CONTINENTS_PATHS: ContinentPath[] = [
  // North America
  {
    name: "North America",
    d: "M 80,100 L 120,60 L 220,60 L 240,110 L 220,130 L 230,160 L 210,180 L 180,240 L 170,250 L 160,230 L 155,180 L 140,170 L 120,165 L 110,180 L 95,170 L 80,120 Z",
  },
  // Greenland
  {
    name: "Greenland",
    d: "M 280,50 L 320,40 L 340,65 L 310,95 L 290,90 Z",
  },
  // South America
  {
    name: "South America",
    d: "M 170,250 L 195,250 L 245,285 L 260,320 L 220,380 L 210,430 L 195,450 L 190,440 L 195,380 L 180,340 L 160,290 Z",
  },
  // Africa
  {
    name: "Africa",
    d: "M 440,210 L 460,200 L 485,210 L 530,220 L 550,260 L 575,290 L 550,370 L 535,410 L 525,430 L 520,420 L 515,380 L 470,310 L 440,290 L 430,240 Z",
  },
  // Madagascar
  {
    name: "Madagascar",
    d: "M 570,360 L 580,370 L 570,400 L 560,390 Z",
  },
  // Europe & Asia (Eurasia)
  {
    name: "Eurasia",
    d: "M 420,160 L 440,130 L 460,110 L 490,90 L 540,85 L 610,75 L 700,70 L 780,75 L 880,85 L 910,105 L 900,140 L 915,160 L 880,175 L 890,200 L 840,225 L 820,260 L 800,270 L 780,240 L 750,250 L 710,290 L 680,285 L 685,260 L 640,260 L 610,230 L 570,250 L 560,210 L 510,200 L 470,200 L 450,170 Z",
  },
  // India
  {
    name: "India",
    d: "M 685,260 L 700,285 L 710,290 L 715,270 Z",
  },
  // Japan
  {
    name: "Japan",
    d: "M 885,145 L 895,150 L 890,185 L 880,175 Z",
  },
  // United Kingdom & Ireland
  {
    name: "United Kingdom & Ireland",
    d: "M 415,120 L 425,115 L 430,135 L 418,140 Z",
  },
  // Iceland
  {
    name: "Iceland",
    d: "M 390,80 L 410,75 L 405,90 L 392,90 Z",
  },
  // Indonesia & Southeast Asia Islands
  {
    name: "Indonesia",
    d: "M 760,290 L 820,290 L 845,310 L 830,335 L 775,325 Z",
  },
  // Australia
  {
    name: "Australia",
    d: "M 810,360 L 870,360 L 890,390 L 880,430 L 840,435 L 805,400 Z",
  },
  // New Zealand
  {
    name: "New Zealand",
    d: "M 910,440 L 925,450 L 915,475 L 900,460 Z",
  }
];
