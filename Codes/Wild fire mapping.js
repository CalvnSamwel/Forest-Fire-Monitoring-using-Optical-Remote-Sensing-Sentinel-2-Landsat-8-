/////========================================================================================
//        NASA ARSET Training: Using Earth Observations for Pre- and Post-Fire Monitoring
//===========================================================================================

//****** Training website: https://appliedsciences.nasa.gov/join-mission/training/english/arset-using-earth-observations-pre-and-post-fire-monitoring ******


//This script was slightly modified from the UN Spider NBR Recommended Practices Code
//https://un-spider.org/advisory-support/recommended-practices/recommended-practice-burn-severity

//This script implemented by Calvin Samwel Swai, modified by Amber McCullum (NASA ARSET) and reviewed/edited by Britnay Beaudry (NASA DEVELOP)




//For this exercise we will:
// (1) Select the study area
// (2) Select the date range
// (3) Select the satellite platform (Landsat 8 or Sentinel 2)

//Then we will run much of the same code from the UN Spider workflow mentioned above. 
//The beauty of this script is that it is easily modified for your area and date range.
//These steps include: 
// (4)  Identifying what the user selected in steps 1-3
// (5)  Apply a cloud and snow mask
// (6)  Mosaic and clip images to the study area
// (7)  Calculate the NBR for the pre- and post-fire images
// (8)  Calculate the dNBR
// (9)  Add all the image layers to the map
// (10) Calculate burned area
// (11) Add a legend to the map
// (12) Export the dNBR image
// (13) Export the burned area statistics as a .csv


//*******************************************************************************************
//                             PART 1: SELECT YOUR OWN STUDY AREA   
//*******************************************************************************************

//Use Burundi as your example
//Feel free to modify the study area after we step through the Burundi example
//Just remember to delete or outcomment the Burundi geometry before creating a new one!

//You can use this to identify any country in the world: Burundi
var geometry = ee.FeatureCollection("FAO/GAUL/2015/level0").filter(ee.Filter.eq('ADM0_NAME', 'Burundi'))


//Note that this will not work for very large countries like neighboring Brazil. For that, you will need to create your own geometry.

//***OR***//
//This is a small rectangle in eastern Burundi
// var geometry2 = ee.Geometry.Polygon([ [ [30.028343894559786,-4.072895729990388],[30.182495811063692,-4.072895729990388],[30.182495811063692,-3.973919998044861],[30.028343894559786,-3.973919998044861],[30.028343894559786,-4.072895729990388]] ]);

//If you'd like to create your own geometry, follow these steps below:
// Use the polygon-tool in the top left corner of the map pane to draw the shape of your 
// study area. Single clicks add vertices, double-clicking completes the polygon.
// **CAREFUL**: Under 'Geometry Imports' (top left in map pane) uncheck the 
//                geometry box, so it does not block the view on the imagery later.

//*******************************************************************************************
//                                    PART 2: SET TIME FRAME
//*******************************************************************************************

// Set start and end dates of a period BEFORE the fire. Make sure it is long enough for 
// either Landsat-8 or Sentinel-2 to acquire an image. Adjust these parameters, if
// your ImageCollections (see Console) do not contain any elements.

//Here are the details for the Landsat 8 scenes and dates for the Burundi Fires that have relatively low cloud cover (From investigation in Earth Explorer):
//prefire: Path 231, Row 70, date 2018/07/17 AND Path 230,Row 70, date 2018/07/26  
//postfire: Path 231, Row 70, date 2021/07/09 AND Path 230,Row 70, date 2021/07/02  

//Set the pre-fire dates
var prefire_start = '2018-01-01';   
var prefire_end = '2018-12-31';

// Now set the same parameters for AFTER the fire.
var postfire_start = '2020-11-01';
var postfire_end = '2021-11-01';

//*******************************************************************************************
//                           PART 3: SELECT A SATELLITE PLATFORM
//*******************************************************************************************

// You can select remote sensing imagery from two availible satellite sensors. 
// Consider details of each mission below to choose the data suitable for your needs.

// Landsat 8                             |  Sentinel-2 (A&B)
//-------------------------------------------------------------------------------------------
// launched:        February 11th, 2015  |  June 23rd, 2015 & March 7th, 2017
// repitition rate: 16 days              |  5 day (since 2017)
// resolution:      30 meters            |  10 meters 
// advantages:      longer time series   |  9 times higher spatial detail
//                  smaller export file  |  higher chance of cloud-free images

// SELECT one of the following:   'L8'  or 'S2' 

//***//Use Landsat-8 for your first run of the Burundi example, then you can test out Sentinel-2 afterwards

var platform = 'L8';               // <--- assign your choice to the platform variable


//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//---->>> DO NOT EDIT THE SCRIPT PAST THIS POINT! (unless you know what you are doing) <<<---
//------------------->>> NOW HIT 'RUN' AT THE TOP OF THE SCRIPT! <<<-------------------------
//--> THE FINAL BURN SEVERITY PRODUCT WILL READY FOR DOWNLOAD ON THE RIGHT (UNDER TASKS) <---
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::


//*******************************************************************************************
//                           PART 4: IDENTIFY AND RUN USER INPUTS 
//*******************************************************************************************

// Print the satellite platform and dates to console
//This identifies which satellite platform you selected with an if/then statement
if (platform == 'S2' | platform == 's2') {
  var ImCol = 'COPERNICUS/S2';
  var pl = 'Sentinel-2';
} else {
  var ImCol = 'LANDSAT/LC08/C02/T1_TOA';
  var pl = 'Landsat 8';
}
print(ee.String('Data selected for analysis: ').cat(pl));
print(ee.String('Fire incident occurred between ').cat(prefire_end).cat(' and ').cat(postfire_start));

// Location
//This sets the location where all the analysis will be conducted
//Be sure to only have one "geometry" created above
var area = ee.FeatureCollection(geometry);

// Set study area as map center.
Map.centerObject(area);

// Select imagery by time and location 
var imagery = ee.ImageCollection(ImCol);

// In the following lines imagery will be collected in an ImageCollection, depending on the
// location of our study area and a given time frame.
var prefireImCol = ee.ImageCollection(imagery
    // Filter by dates.
    .filterDate(prefire_start, prefire_end)
    // Filter by location.
    .filterBounds(area));
    
// Select all images that overlap with the study area from a given time frame 
var postfireImCol = ee.ImageCollection(imagery
    // Filter by dates.
    .filterDate(postfire_start, postfire_end)
    // Filter by location.
    .filterBounds(area));

// Add the clipped images to the console on the right
print("Pre-fire Image Collection: ", prefireImCol); 
print("Post-fire Image Collection: ", postfireImCol);

//*******************************************************************************************
//                           PART 5: APPLY A CLOUD AND SNOW MASK 
//*******************************************************************************************

// Function to mask clouds from the pixel quality band of Sentinel-2 SR data.
function maskS2sr(image) {
  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = ee.Number(2).pow(10).int();
  var cirrusBitMask = ee.Number(2).pow(11).int();
  // Get the pixel QA band.
  var qa = image.select('QA60');
  // All flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  // Return the masked image, scaled to TOA reflectance, without the QA bands.
  return image.updateMask(mask)
      .copyProperties(image, ["system:time_start"]);
}

// Function to mask clouds from the pixel quality band of Landsat 8 SR data.
function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = 1 << 3;
  var cloudsBitMask = 1 << 5;
  var snowBitMask = 1 << 4;
  // Get the pixel QA band.
  var qa = image.select('QA_PIXEL');
  // All flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
      .and(qa.bitwiseAnd(cloudsBitMask).eq(0))
      .and(qa.bitwiseAnd(snowBitMask).eq(0));
  // Return the masked image, scaled to TOA reflectance, without the QA bands.
  return image.updateMask(mask)
      .select("B[0-9]*")
      .copyProperties(image, ["system:time_start"]);
}

// Apply platform-specific cloud mask
if (platform == 'S2' | platform == 's2') {
  var prefire_CM_ImCol = prefireImCol.map(maskS2sr);
  var postfire_CM_ImCol = postfireImCol.map(maskS2sr);
} else {
  var prefire_CM_ImCol = prefireImCol.map(maskL8sr);
  var postfire_CM_ImCol = postfireImCol.map(maskL8sr);
}


//*******************************************************************************************
//                           PART 6: MOSAIC AND CLIP IMAGES TO STUDY AREA 
//*******************************************************************************************

// This is especially important, if the collections created above contain more than one image
// (if it is only one, the mosaic() does not affect the imagery).

var pre_mos = prefireImCol.mosaic().clip(area);
var post_mos = postfireImCol.mosaic().clip(area);

var pre_cm_mos = prefire_CM_ImCol.mosaic().clip(area);
var post_cm_mos = postfire_CM_ImCol.mosaic().clip(area);

// Add the clipped images to the console on the right
print("Pre-fire True Color Image: ", pre_mos); 
print("Post-fire True Color Image: ", post_mos);

//*******************************************************************************************
//                           PART 7: CALCULATE NBR FOR PRE- AND POST-FIRE IMAGES
//*******************************************************************************************

// Apply platform-specific NBR = (NIR-SWIR2) / (NIR+SWIR2)
if (platform == 'S2' | platform == 's2') {
  var preNBR = pre_cm_mos.normalizedDifference(['B8', 'B12']);
  var postNBR = post_cm_mos.normalizedDifference(['B8', 'B12']);
} else {
  var preNBR = pre_cm_mos.normalizedDifference(['B5', 'B7']);
  var postNBR = post_cm_mos.normalizedDifference(['B5', 'B7']);
}


// Add the NBR images to the console on the right
print("Pre-fire Normalized Burn Ratio: ", preNBR); 
print("Post-fire Normalized Burn Ratio: ", postNBR);


//*******************************************************************************************
//                PART 8: CALCULATE DIFFERENCE BETWEEN PRE- AND POST-FIRE IMAGES 
//*******************************************************************************************

// The result is called delta NBR or dNBR
var dNBR_unscaled = preNBR.subtract(postNBR);

// Scale product to USGS standards
var dNBR = dNBR_unscaled.multiply(1000);

// Add the difference image to the console on the right
print("Difference Normalized Burn Ratio: ", dNBR);


//*******************************************************************************************
//                           PART 9: ADD LAYERS TO MAP
//*******************************************************************************************

// Add boundary.
Map.addLayer(area.draw({color: 'ffffff', strokeWidth: 5}), {},'Study Area');

//---------------------------------- True Color Imagery ------------------------------------

// Apply platform-specific visualization parameters for true color images
if (platform == 'S2' | platform == 's2') {
  var vis = {bands: ['B4', 'B3', 'B2'], max: 2000, gamma: 1.5};
} else {
  var vis = {bands: ['B4', 'B3', 'B2'], min: 0, max: 4000, gamma: 1.5};
}

// Add the true color images to the map.
Map.addLayer(pre_mos, vis,'Pre-fire image');
Map.addLayer(post_mos, vis,'Post-fire image');

// Add the true color images to the map.
Map.addLayer(pre_cm_mos, vis,'Pre-fire True Color Image - Clouds masked');
Map.addLayer(post_cm_mos, vis,'Post-fire True Color Image - Clouds masked');

//--------------------------- Burn Ratio Product - Greyscale -------------------------------

var grey = ['white', 'black'];

// Remove comment-symbols (//) below to display pre- and post-fire NBR seperately
//Map.addLayer(preNBR, {min: -1, max: 1, palette: grey}, 'Prefire Normalized Burn Ratio');
//Map.addLayer(postNBR, {min: -1, max: 1, palette: grey}, 'Postfire Normalized Burn Ratio');

Map.addLayer(dNBR, {min: -1000, max: 1000, palette: grey}, 'dNBR greyscale');

//------------------------- Burn Ratio Product - Classification ----------------------------

// Define an SLD style of discrete intervals to apply to the image.
var sld_intervals =
  '<RasterSymbolizer>' +
    '<ColorMap type="intervals" extended="false" >' +
      '<ColorMapEntry color="#ffffff" quantity="-500" label="-500"/>' +
      '<ColorMapEntry color="#7a8737" quantity="-250" label="-250" />' +
      '<ColorMapEntry color="#acbe4d" quantity="-100" label="-100" />' +
      '<ColorMapEntry color="#0ae042" quantity="100" label="100" />' +
      '<ColorMapEntry color="#fff70b" quantity="270" label="270" />' +
      '<ColorMapEntry color="#ffaf38" quantity="440" label="440" />' +
      '<ColorMapEntry color="#ff641b" quantity="660" label="660" />' +
      '<ColorMapEntry color="#a41fd6" quantity="2000" label="2000" />' +
    '</ColorMap>' +
  '</RasterSymbolizer>';

// Add the image to the map using both the color ramp and interval schemes.
Map.addLayer(dNBR.sldStyle(sld_intervals), {}, 'dNBR classified');

// Seperate result into 8 burn severity classes
var thresholds = ee.Image([-1000, -251, -101, 99, 269, 439, 659, 2000]);
var classified = dNBR.lt(thresholds).reduce('sum').toInt();


//*******************************************************************************************
//                           PART 10A: CALCULATE BURNED AREA
//*******************************************************************************************

///***///Note that if you run this for the entire country of Burundi you will get an error
//Image.reduceRegion: Too many pixels in the region. maxPixels allows only 10000000. 
//See Part 10B where I provide an example of creating a smaller area to run the calculation. 


// count number of pixels in entire layer
var allpix =  classified.updateMask(classified);  // mask the entire layer
var pixstats = allpix.reduceRegion({
  reducer: ee.Reducer.count(),               // count pixels in a single class
  geometry: area,
  scale: 30
  });
var allpixels = ee.Number(pixstats.get('sum')); // extract pixel count as a number


// create an empty list to store area values in
var arealist = [];

// create a function to derive extent of one burn severity class
// arguments are class number and class name
var areacount = function(cnr, name) {
 var singleMask =  classified.updateMask(classified.eq(cnr));  // mask a single class
 var stats = singleMask.reduceRegion({
  reducer: ee.Reducer.count(),               // count pixels in a single class
  geometry: area,
  scale: 30
  });
var pix =  ee.Number(stats.get('sum'));
var hect = pix.multiply(900).divide(10000);                // Landsat pixel = 30m x 30m --> 900 sqm
var perc = pix.divide(allpixels).multiply(10000).round().divide(100);   // get area percent by class and round to 2 decimals
arealist.push({Class: name, Pixels: pix, Hectares: hect, Percentage: perc});
};

// severity classes in different order
var names2 = ['NA', 'High Severity', 'Moderate-high Severity',
'Moderate-low Severity', 'Low Severity','Unburned', 'Enhanced Regrowth, Low', 'Enhanced Regrowth, High'];

// execute function for each class
for (var i = 0; i < 8; i++) {
  areacount(i, names2[i]);
  }

print('Burned Area by Severity Class', arealist, '--> click list objects for individual classes');

//*******************************************************************************************
//                           PART 10B: CALCULATE BURNED AREA (Smaller area)
//*******************************************************************************************

//The below geometry lat/long points were generated from creating a polygon on the map and extracting the endpoints
//This is a small rectangle in eastern Burundi
var geometry2 = ee.Geometry.Polygon([ [ [30.028343894559786,-4.072895729990388],[30.182495811063692,-4.072895729990388],[30.182495811063692,-3.973919998044861],[30.028343894559786,-3.973919998044861],[30.028343894559786,-4.072895729990388]] ]);

// Location
var area2 = ee.FeatureCollection(geometry2);

// count number of pixels in entire layer
var allpix =  classified.updateMask(classified);  // mask the entire layer
var pixstats = allpix.reduceRegion({
  reducer: ee.Reducer.count(),               // count pixels in a single class
  geometry: area2,
  scale: 30
  });
var allpixels = ee.Number(pixstats.get('sum')); // extract pixel count as a number


// create an empty list to store area values in
var arealist = [];

// create a function to derive extent of one burn severity class
// arguments are class number and class name
var areacount = function(cnr, name) {
 var singleMask =  classified.updateMask(classified.eq(cnr));  // mask a single class
 var stats = singleMask.reduceRegion({
  reducer: ee.Reducer.count(),               // count pixels in a single class
  geometry: area2,
  scale: 30
  });
var pix =  ee.Number(stats.get('sum'));
var hect = pix.multiply(900).divide(10000);                // Landsat pixel = 30m x 30m --> 900 sqm
var perc = pix.divide(allpixels).multiply(10000).round().divide(100);   // get area percent by class and round to 2 decimals
arealist.push({Class: name, Pixels: pix, Hectares: hect, Percentage: perc});
};

// severity classes in different order
var names2 = ['NA', 'High Severity', 'Moderate-high Severity',
'Moderate-low Severity', 'Low Severity','Unburned', 'Enhanced Regrowth, Low', 'Enhanced Regrowth, High'];

// execute function for each class
for (var i = 0; i < 8; i++) {
  areacount(i, names2[i]);
  }

print('Burned Area by Severity Class', arealist, '--> click list objects for individual classes');

//*******************************************************************************************
//                           PART 11: ADD A LEGEND
//*******************************************************************************************

// set position of panel
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }});
 
// Create legend title
var legendTitle = ui.Label({
  value: 'dNBR Classes',
  style: {fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
    }});
 
// Add the title to the panel
legend.add(legendTitle);
 
// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
 
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }});
 
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
 
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      })};
 
//  Palette with the colors
var palette =['7a8737', 'acbe4d', '0ae042', 'fff70b', 'ffaf38', 'ff641b', 'a41fd6', 'ffffff'];
 
// name of the legend
var names = ['Enhanced Regrowth, High','Enhanced Regrowth, Low','Unburned', 'Low Severity',
'Moderate-low Severity', 'Moderate-high Severity', 'High Severity', 'NA'];
 
// Add color and and names
for (var i = 0; i < 8; i++) {
  legend.add(makeRow(palette[i], names[i]));
  }  
 
// add legend to map (alternatively you can also print the legend to the console)
Map.add(legend);

//*******************************************************************************************
//                           PART 12: EXPORT dNBR FILE
//*******************************************************************************************

var id = dNBR.id().getInfo();
      
Export.image.toDrive({image: dNBR, scale: 30, description: id, fileNamePrefix: 'dNBR',
  region: area, maxPixels: 1e10});


// Downloads will be availible in the 'Tasks'-tab on the right.

//*******************************************************************************************
//                           PART 13: EXPORT BURNED AREA STATS AS A CSV
//*******************************************************************************************

//Make arealist a feature collection so that it can be exported as a CSV, since you can't export a list (arealist) as a CSV in GEE
var fc = ee.FeatureCollection(arealist.map(function(arealist) {
  return ee.Feature(null,{Class:arealist.Class, Hectares:arealist.Hectares, Percentage:arealist.Percentage, Pixels:arealist.Pixels})})) //create a function to return the arealist properties and values into your new feature collection

//Check that the feature collection of your list (fc_10B) contains all the right info
print('Feature Collection of Burned Areas', fc);

//Export the burned area stats 'arealist' as a csv
Export.table.toDrive({
  collection: fc, //The feature collection to export
  description: 'BurnedAreaStats', //The name of the task for the 'Tasks'-tab
  fileFormat: 'CSV', //A list of properties to include in the export
  folder: 'ARSET_PrePostFireMonitoring', //The folder in your Google Drive that the csv will reside in
  selectors: ['system:index','Class', 'Hectares', 'Pixels', 'Percentage'], //A list of properties to include in the export
});

//End of Script