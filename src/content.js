var map = {};
var regex = new RegExp(/^\s*[\(\[]([^\)\]]+)[\)\]]/);
var reasonRegex = new RegExp(/^(W[0-9]+)/);
var noteGroups = {};
$('.entry_row').each(function(){ 
   var hrs = $(this).find('.hours').text();
   var day = $(this).find('.day').text();
   var client = $(this).find('.client').find('a').text();
   var wo = $(this).find('.project').find('a').text() || $(this).find('.project').find('span').text();
   var note = $(this).find('.notes').text();
   var noteGroup = "[General]";

   if (regex.test(note)) {
      noteGroup = regex.exec(note)[1];
	  if (!noteGroups[client]) noteGroups[client] = [];		  
	  
	  noteGroups[client][noteGroup] = noteGroup;
   } else {
	   var $flagEntry = $(this).next('.work_order_flag_entry:not(.hide)');
	   var flagReason = $flagEntry.find('.flag_reason').text();
	   
	   if (reasonRegex.test(flagReason)) {
		   noteGroup = "[" + reasonRegex.exec(flagReason)[1] + "]";
	   }
   }

   if (!map[client]) map[client] = [];
   if (!map[client][wo]) map[client][wo] = [];
   if (!map[client][wo][noteGroup]) map[client][wo][noteGroup] = [];
   if (!map[client][wo][noteGroup][day]) map[client][wo][noteGroup][day] = 0;

   map[client][wo][noteGroup][day] += parseFloat(hrs);
});

var allDows = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var dowSortOrder = {};
for(var i=0;i<allDows.length;i++){
    dowSortOrder[allDows[i]] = i;
}

var dowSortFunc = function(a,b) {
    return dowSortOrder[a.name] > dowSortOrder[b.name];
}

var sortFunc = function(a,b) {
    if (a.name == '[General]') return -1;
    if (b.name == '[General]') return 1;
    
    return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0);
};

var autocomplete = function(){
	var field = $(this);
	var val = field.val();
	
	if (val.length) $('#mfTimesheet_autocomplete').remove();
	
	var client = field.parents('.entry_row,.time_entry_inputs').find('#inline_edit_client,#client').val();
	
	var notes = noteGroups[client];
	if (!notes||!notes.length) return;
	
	new Awesomplete(field, {
		list: notes
	});
};

$('#notes,.inline_text_edit').on('focus', autocomplete);

var sortedMap = [];
for(var client in map) {
    if (!map.hasOwnProperty(client)) continue;
    
    var clientMap = {
        'name': client,
        'wos': []
    };
    
    for(var wo in map[client]) {
        if (!map[client].hasOwnProperty(wo)) continue;
        
        var woMap = {
            'name': wo,
            'notes': []
        };
        
        for(var note in map[client][wo]) {
            if (!map[client][wo].hasOwnProperty(note)) continue;
            
            var hours = 0;
            
            var dowMap = [];
            
			for(var i=0;i<allDows.length;i++) {
				var dowName = allDows[i];
				var dowHours = 0;
				
				for(var dow in map[client][wo][note]) {
					if (!map[client][wo][note].hasOwnProperty(dow)) continue;
					
					if (dow == dowName) {
						dowHours = map[client][wo][note][dow];
						
						hours += dowHours;
					}
				}	
				
				dowMap.push({
					'name': dow,
					'hours': dowHours
				});
			}
            
            dowMap.sort(dowSortFunc);
            
            var noteMap = {
                'name': note,
                'hours': hours,
                'dows': dowMap
            };
            
            woMap.notes.push(noteMap);
        }
        
        woMap.notes.sort(sortFunc);
        
        if (woMap.notes.length == 1 && woMap.notes[0].name == '[General]') {
            woMap.hours = woMap.notes[0].hours;
        }
        
        clientMap.wos.push(woMap);
    }
    
    clientMap.wos.sort(sortFunc);
    
    sortedMap.push(clientMap);
}

sortedMap.sort(sortFunc);


$('#mfTimesheetSummary').remove();

var $root = $('<div id="mfTimesheetSummary" />');

var $header = $('<h2 class="mfTimesheet_linkToggle">Timesheet Summary (Hours) &raquo;</h2>')
var $wrapper = $('<div id="mfTimesheetSummary_Wrapper" />');

$wrapper.append('<hr/>');

$root.append($header);

$header.on('click', function(){
   $('#mfTimesheetSummary_Wrapper').slideToggle();
});


function fmt(hrs) {
	return parseFloat(Math.round(hrs * 100) / 100).toFixed(2);
}

for(var i=0;i<sortedMap.length;i++) {
    var client = sortedMap[i];
    
    var $client = $('<div class="mfTimesheet_client"><h2>' + client.name + '</h2></div>');
    
    for(var j=0;j<client.wos.length;j++) {
        var wo = client.wos[j];
        
        var $wo = $('<div class="mfTimesheet_wo"><b>' + wo.name + '</b></div>');
        var $tbl = $('<table class="mfTimesheet_tbl"/>');

		$tbl.append('<tr><th></th><th class="mfTimesheet_dow_heading mfTimesheet_dow_odd">Ttl</th><th class="mfTimesheet_dow_heading">S</th><th class="mfTimesheet_dow_heading">M</th><th class="mfTimesheet_dow_heading">T</th><th class="mfTimesheet_dow_heading">W</th><th class="mfTimesheet_dow_heading">T</th><th class="mfTimesheet_dow_heading">F</th><th class="mfTimesheet_dow_heading">S</th></tr>');
		
		
        for(var k=0;k<wo.notes.length;k++) {
            var note = wo.notes[k];
			$row = $('<tr/>');
            if (!wo.hours) {
                $row.append('<td class="mfTimesheet_note"><b>' + note.name + '</b></td><td class="mfTimesheet_note_hrs mfTimesheet_dow_cell mfTimesheet_dow_odd">' + fmt(note.hours) + '</td>');
            } else {
				$row.append('<td></td><td class="mfTimesheet_note_hrs mfTimesheet_dow_cell mfTimesheet_dow_odd">' + fmt(wo.hours) + '</td>');
			}
                
            for(var l=0;l<note.dows.length;l++) {
                var dow = note.dows[l];
				var isLast = l == note.dows.length - 1;
				var isStriped = k % 2 == 1;
                $row.append('<td class="mfTimesheet_dow_cell' + (isStriped ? ' mfTimesheet_dow_odd' : '') + '">' + fmt(dow.hours) + '</td>');    
            }
            
			$tbl.append($row);
			
            $wo.append($tbl);
        }
        
		$client.append($wo);
    }
	$wrapper.append($client);
}

$wrapper.append('<div class="mfTimesheet_clear">&nbsp;</div>');

$root.append($wrapper);

$root.insertAfter($('#TSEntryForm'));

