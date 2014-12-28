define(function () {

    return {
        createRange: function (options, start) {
            var countof = options.length, full = 11, SPAN = Math.floor(full / 2), range = [];

            if (start > 0) {
                range.push({ index: 0
                             , text: options[0].text
                             , article: options[0].value
                });
            }


            if ((countof - start) < 3) {
                SPAN = full - (countof - start);
            }

            if (start > SPAN) {
                var f = Math.max(1, Math.floor(start / SPAN)), o = f;
                while (o < start && range.length < SPAN) {
                    range.push({ index: o
                               , text: options[o].text
                               , article: options[o].value
                    });
                    o += f;
                }
            }

            SPAN = full - range.length - 1;

            var o = start, spanof = countof - o, f = Math.max(1, Math.floor(spanof / SPAN));
            while (o < countof) {
                range.push({ index: o
                             , text: options[o].text
                             , article: options[o].value
                });
                o += f;
            }


            if (range[range.length - 1].index != (options.length - 1))
                range.push({ index: options.length - 1
                             , text: options[options.length - 1].text
                             , article: options[options.length - 1].value
                });

            return range;
        }
    }

})