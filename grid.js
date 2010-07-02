/* 
 * https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Array/indexOf
 */
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(elt /*, from*/) {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++) {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}

/*
 * and here's our grid-making code:
 */
var Hope = (function(){
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    ROOMS = ["Tesla", "Lovelace", "Bell"];
              
  var schedule;

  var twochar = function(str) {
    return (String(str).length == 1) ? '0' + str : str;
  };
  var parse_timestamps = function() {
    for(var i = 0; i < schedule.length; ++i) {
      var d = new Date(Number(schedule[i].timestamp) * 1000);
      schedule[i].date = d;
      schedule[i].day = DAY_NAMES[d.getUTCDay()];
      schedule[i].time = twochar(d.getUTCHours()) + "" + twochar(d.getUTCMinutes());
    }
  };
  var compare_talks = function(a, b) {
    var td = a.timestamp - b.timestamp;
    if (td != 0)
      return td;
    return ROOMS.indexOf(a.location) - ROOMS.indexOf(b.location);
  };
  var rooms_header = function() {
    var $tr = $("<tr>");
    $tr.append($("<th>"));
    for (var i = 0; i < ROOMS.length; ++i) {
      $tr.append($("<th>", {text: ROOMS[i], 'class': 'room_header'}));
    }
    return $tr;
  };
  var toggle_desc = function() {
    $(this).parents("td.talk").find(".talkdesc").toggle();
  };
  var emit_row = function(time, talks) {
    var $tr = $("<tr>");
    $tr.append($("<td>", {text: time, 'class': 'timestamp'}));
    for(var i = 0; i < ROOMS.length; ++i) {
      var $td = $("<td>");
      if (talks[i] === undefined) {
        $td.addClass("emptyroom").text("\u00A0");
      } else {
        $td.addClass("talk");
        $td.append($("<div>").append($("<a>", {html: talks[i].title, 'class': 'talktitle', 'click': toggle_desc})));
        var $div = $("<div>", {'class': 'talkdesc', css: {'display': 'none'}});
        $div.append($("<p>", {html: talks[i].description}));
        for(var j = 0; j < talks[i].speakers.length; ++j) {
          $div.append($("<p>", {'class': 'speaker', html: '<strong>' + talks[i].speakers[j].name + '</strong>: ' + talks[i].speakers[j].bio}));
        }
        $td.append($div);
      }
      $tr.append($td);
    }
    return $tr;
  };
  var create_controls = function() {
    var $c = $("#controls");
    var $descs = $(".talkdesc");
    var mka = function(txt, val) {
      return $("<a>", {
               text: txt,
               click: function() { $descs.toggle(val); }
               });
    };
    $c.append(mka("show all descriptions", true)).append(" | ").append(mka("hide all descriptions", false));
  };

  return {
    get_schedule : function() {
      return schedule;
    },
    make_schedule : function(sked) {
      schedule = sked;
      parse_timestamps();
      schedule.sort(compare_talks);
      Hope.display_schedule();
    },
    display_schedule : function() {
      var $div = $("#schedule");
      var $table = $("<table>");
      var day = undefined, time = undefined, talks = undefined;
      
      for(var i = 0; i < schedule.length; ++i) {
        var talk = schedule[i];
        if (talk.time !== time) {
          if (talks !== undefined)
            $table.append(emit_row(time, talks));
          time = talk.time;
          talks = [];
        }
        if (talk.day !== day) {
          day = talk.day;
          $table.append($("<tr>").append($("<th>", {'class': 'day_header', colspan:4, text:day})));
          $table.append(rooms_header());
        }
        talks[ROOMS.indexOf(talk.location)] = talk;
      }
      if (talks !== undefined) {
        $table.append(emit_row(time, talks));
        $div.empty().append($table);
      } else {
        $div.empty().append("<p>", {text: "Unable to load schedule?", css: {color: "red"}});
      }
      create_controls();
    }
  };
})();
