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
var Hope = (function($){
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    ROOMS = ["Tesla", "Lovelace", "Bell"];
              
  var schedule, header_prototype;

  var twochar = function(str) {
    return (String(str).length == 1) ? '0' + str : str;
  }, twelvehour = function(n) {
    return (n+11) % 12 + 1;
  }, ampm = function(n) {
    return n < 12 ? "\u00a0am" : "\u00a0pm";
  };
  var parse_timestamps = function() {
    for(var i = 0; i < schedule.length; ++i) {
      var d = new Date(Number(schedule[i].timestamp) * 1000);
      var day = d.getUTCDay(), hour = d.getUTCHours(), min = twochar(d.getUTCMinutes());
      schedule[i].date = d;
      schedule[i].day = DAY_NAMES[day];
      schedule[i].time = twochar(hour) + "" + min;
      schedule[i].time2 = twelvehour(hour) + ":" + min + ampm(hour);
    }
  };
  var compare_talks = function(a, b) {
    var td = a.timestamp - b.timestamp;
    if (td != 0)
      return td;
    return ROOMS.indexOf(a.location) - ROOMS.indexOf(b.location);
  };
  var rooms_header = function() {
    if (header_prototype === undefined) {
      header_prototype = $("<tr>");
      header_prototype.append($("<th>"));
      for (var i = 0; i < ROOMS.length; ++i) {
        header_prototype.append($("<th>", {text: ROOMS[i], 'class': 'room_header'}));
      }
    }
    return header_prototype.clone();
  };
  var toggle_desc = function() {
    $(this).parents("td.talk").find(".talkdesc").toggle();
  };
  var emit_row = function(time, time2, talks) {
    var $tr = $("<tr>");

    $tr.append($("<td>", {'class': 'timestamp'})
               .append($("<span>", {text: time, 'class': 'time1'}))
               .append($("<span>", {text: time2, 'class': 'time2', css:{display: 'none'}})));
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
          $div.append($("<p>", {'class': 'speaker', html: '<strong>' + talks[i].speakers[j].name + '</strong> ' + talks[i].speakers[j].bio}));
        }
        $td.append($div);
      }
      $tr.append($td);
    }
    return $tr;
  };
  var create_controls = function() {
    var $c = $("#controls");
    var $descs = $(".talkdesc"), $t1 = $(".time1"), $t2 = $(".time2");
    var mka = function(txt, val) {
      return $("<a>", {
               text: txt,
               click: function() { $descs.toggle(val); }
               });
    }, mkb = function(cls) {
      return $("<input>", {
                 name: "timeformat",
                 value: cls,
                 type: "radio",
                 id: "radio_" + cls,
                 click: function() {
                   $t1.toggle(cls === "time1");
                   $t2.toggle(cls === "time2");
                 },
                 checked: (cls === "time1")
               });
    }, mkl = function(txt, cls) {
      return $("<label>", {
                 'for': "radio_" + cls,
                 text: txt
               });
    };
    $c.append(mka("show all descriptions", true)).append(" | ").append(mka("hide all descriptions", false))
      .append($("<br>")).append("Time format: \u00a0 ")
      .append(mkb("time1")).append(mkl("24-hour", "time1"))
      .append(" \u00a0 ")
      .append(mkb("time2")).append(mkl("am/pm", "time2"));
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
      var day = undefined, time = undefined, talks = undefined, time2;

      for(var i = 0; i < schedule.length; ++i) {
        var talk = schedule[i];
        if (talk.time !== time) {
          if (talks !== undefined)
            $table.append(emit_row(time, time2, talks));
          time = talk.time;
          time2 = talk.time2;
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
        $table.append(emit_row(time, time2, talks));
        $div.empty().append($table);
      } else {
        $div.empty().append("<p>", {text: "Unable to load schedule?", css: {color: "red"}});
      }
      create_controls();
    },
    load_analytics : function() {
      var _gaq = [];
      _gaq.push(['_setAccount', 'UA-11852858-1']);
      _gaq.push(['_setDomainName', 'none']);
      _gaq.push(['_setAllowLinker', true]);
      _gaq.push(['_trackPageview']);
      window._gaq = _gaq;

      var ga = $("<script>", {
                   type: 'text/javascript',
                   async: true,
                   src: ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js'
      });
      $('head').append(ga);
    }
  };
})(jQuery);
