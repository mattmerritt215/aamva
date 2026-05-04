let ISSUERS_JSON = [];

$(document).ready(() => {
  fetch("assets/issuers.json")
    .then((response) => response.json())
    .then((data) => {
      ISSUERS_JSON = data;
      $.each(ISSUERS_JSON, (i) => {
        $("#selIssueState").append(`<option value="${ISSUERS_JSON[i].abbreviation}" data-iin="${ISSUERS_JSON[i].iin}">${ISSUERS_JSON[i].abbreviation}</option>`);
        $("#selAddressState").append(`<option value="${ISSUERS_JSON[i].abbreviation}">${ISSUERS_JSON[i].abbreviation}</option>`);
      });
    })
    .catch((error) => {
      console.error('Error fetching JSON data:', error);
    });

    $("#selIssueState").change((e) => {
        let revDate = ISSUERS_JSON.find(issuer => issuer.abbreviation === $("#selIssueState").find("option:selected").val())?.revision_date || "";

        if (revDate !== "") {
            $("#txtRevisionDate").val(revDate);
            $("#txtRevisionDate").prop("readonly", true);
        } else {
            $("#txtRevisionDate").val("");
            $("#txtRevisionDate").prop("readonly", false);
        }
    });

    $("#btnAdvanced").click(function(e) {
        if ($("#advancedFields").hasClass("show")){
            $(this).removeClass("btn-primary");
            $(this).addClass("if-not-collapsed");
        } else {
            $(this).removeClass("if-not-collapsed");
            $(this).addClass("btn-primary");
        }

        $(this).find("i").toggleClass("bi-caret-down-fill bi-caret-up-fill");
    })

    $("#btnSubmit").click((e) => {
        e.preventDefault();
        $.fn.submit();
    })

    $("#btnReset").click((e) => {
        e.preventDefault();
        $.fn.resetForm();
    });

    // Transparent background toggle
    $("#chkTransparentBg").change(function() {
        let transparent = $(this).is(':checked');
        if (transparent) {
            $(".barcode-card-body").addClass("transparent-bg");
        } else {
            $(".barcode-card-body").removeClass("transparent-bg");
        }
        // Redraw PDF417 canvas
        let canvas = document.getElementById('pdf417-canvas');
        if (canvas.width > 0) {
            if (transparent) {
                $.fn.redrawPDF417Transparent();
            } else {
                $.fn.redrawPDF417White();
            }
        }
        // Re-render Code128 SVG with new background
        if ($("#code128-card").is(":visible")) {
            let inventoryNum = $("#txtInventoryNum").val();
            if (inventoryNum) {
                $.fn.generateCode128(inventoryNum);
            }
        }
    });

    // Download PDF417 as PNG
    $("#btnDownloadPDF417").click(function() {
        $.fn.downloadCanvas('pdf417-canvas', 'pdf417-barcode.png');
    });

    // Download Code128 as PNG
    $("#btnDownloadCode128").click(function() {
        $.fn.downloadSVG('code128', 'code128-barcode.png');
    });

    // Download All
    $("#btnDownloadAll").click(function() {
        $.fn.downloadCanvas('pdf417-canvas', 'pdf417-barcode.png');
        if ($("#code128-card").is(":visible")) {
            setTimeout(() => {
                $.fn.downloadSVG('code128', 'code128-barcode.png');
            }, 300);
        }
    });
});


$.fn.extend({
    formatDate: function(dateString) {
        let year = dateString.substring(0,4);
        let month = dateString.substring(5,7);
        let day = dateString.substring(8,10);

        return `${month}${day}${year}`;
    },

    resetForm: function() {
        $('#input-form')[0].reset();
        let canvas = document.getElementById('pdf417-canvas');
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        $('#code128').empty();
        $('#code128-card').hide();
        $('#output').hide();
    },

    submit: function() {
        const AAMVA_COMPLIANCE_INDICATOR = "@";
        const AAMVA_DATA_ELEMENT_SEPERATOR = "\x0A";
        const AAMVA_RECORD_SEPERATOR = "\x1E";
        const AAMVA_SEGMENT_TERMINATOR = "\x0D";
        const AAMVA_FILE_TYPE = "ANSI ";
        const AAMVA_VERSION = "10";
        const AAMVA_JURISDICTION_VERSION = "00";
        const AAMVA_ENTRIES = "02";
        let aamvaSubfile, aamvaIIN, aamvaSubfileType;
        let height, feet, inches;
        let subfileString, consoleString;
        let jurisdictionData, jurisdictionString, jurisdictionType;
        let recordOffset, recordLength, jurisdictionOffset, jurisdictionLength;

        aamvaSubfile = {};

        aamvaIIN = $("#selIssueState").find('option:selected').data('iin');
        aamvaSubfileType = $("#selSubfileType").find("option:selected").val();

        aamvaSubfile.DAQ = $("#txtLicenseNumber").val();

        if ($("#txtLastName").val().length > 40) {
            aamvaSubfile.DCS = $("#txtLastName").val().substring(0,39);
            aamvaSubfile.DDE = "T";
        } else {
            aamvaSubfile.DCS = $("#txtLastName").val();
            aamvaSubfile.DDE = "N";
        }

        if ($("#txtFirstName").val().length > 40) {
            aamvaSubfile.DAC = $("#txtFirstName").val().substring(0,39);
            aamvaSubfile.DDF = "T";
        } else {
            aamvaSubfile.DAC = $("#txtFirstName").val();
            aamvaSubfile.DDF = "N";
        }

        if ($("#txtMiddleName").val()) {
            if ($("#txtMiddleName").val().replace(" ",",").length > 40) {
                aamvaSubfile.DAD = $("#txtMiddleName").val().replace(" ",","). substring(0,39);
                aamvaSubfile.DDG = "T";
            } else {
                aamvaSubfile.DAD = $("#txtMiddleName").val().replace(" ",",");
                aamvaSubfile.DDG = "N";
            }
        }

        if ($('#selGeneration').find("option:selected").val() != ""){
            aamvaSubfile.DCU=$('#selGeneration').find("option:selected").val();
        }

        aamvaSubfile.DCA = $("#txtClassification").val();
        $("#txtRestrictions").val() ? aamvaSubfile.DCB = $("#txtRestrictions").val() : aamvaSubfile.DCB = "NONE";
        $("#txtEndorsements").val() ? aamvaSubfile.DCD = $("#txtEndorsements").val() : aamvaSubfile.DCD = "NONE";

        aamvaSubfile.DBD = $.fn.formatDate($("#txtIssueDate").val());
        aamvaSubfile.DBB = $.fn.formatDate($("#txtBirthDate").val());
        aamvaSubfile.DBA = $.fn.formatDate($("#txtExpirationDate").val());

        if ($("#radMale").is(':checked')) {
            aamvaSubfile.DBC = "1";
        } else if ($("#radFemale").is(':checked')) {
            aamvaSubfile.DBC = "2";
        } else {
            aamvaSubfile.DBC = "9";
        }

        feet = parseInt($("#txtFeet").val());
        inches = parseInt($("#txtInches").val());
        height = (feet * 12) + (inches);
        height <= 99 ? aamvaSubfile.DAU = `0${height.toString(10)} in` : aamvaSubfile.DAU = `${height.toString(10)} in`;

        aamvaSubfile.DAY = $("#selEyes").val();

        aamvaSubfile.DAG = $("#txtStreet").val();
        aamvaSubfile.DAI = $("#txtCity").val();
        aamvaSubfile.DAJ = $("#selAddressState").find("option:selected").val();
        $("#txtZIP").val().length == 5 ? aamvaSubfile.DAK = `${$("#txtZIP").val()}0000` : aamvaSubfile.DAK = `${$("#txtZIP").val()}`;

        aamvaSubfile.DCF = $("#txtDocID").val();
        aamvaSubfile.DCG = "USA";
        aamvaSubfile.DCK = $("#txtInventoryNum").val();

        if ($('#chkRealID').is(':checked')) {
          aamvaSubfile.DDA="F";
        } else {
          aamvaSubfile.DDA="N";
        }
        
        let revDate = ISSUERS_JSON.find(issuer => issuer.abbreviation === $("#selIssueState").find("option:selected").val())?.revision_date || "";
        if (revDate !== "") {
          aamvaSubfile.DDB = $.fn.formatDate(revDate);
        }

        if($('#chkDonor').is(':checked')) {
          aamvaSubfile.DDK="1"
        }

        if($('#chkVeteran').is(':checked')) {
          aamvaSubfile.DDL="1"
        }

        subfileString = aamvaSubfileType;
        consoleString = subfileString;

        let i = 0;
        let subfileCharCount = 0;
        let j = Object.keys(aamvaSubfile).length-1;

        for (const [key, value] of Object.entries(aamvaSubfile)) {
            if ( i < j) {
                subfileString += `${key}${value.toString().toUpperCase()}${AAMVA_DATA_ELEMENT_SEPERATOR}`;
                consoleString += `${key}${value.toString().toUpperCase()}<DataElementSeperator>`;
                subfileCharCount += key.length + value.toString().length + AAMVA_DATA_ELEMENT_SEPERATOR.length;
                i++;
            } else {
                subfileString += `${key}${value.toString().toUpperCase()}${AAMVA_SEGMENT_TERMINATOR}`;
                consoleString += `${key}${value.toString().toUpperCase()}<SegmentTerminator>`;
                subfileCharCount += key.length + value.toString().length + AAMVA_SEGMENT_TERMINATOR.length;
            }
        }

        console.log(`subfileCharCount = ${subfileCharCount}`);
        jurisdictionData=$("#txtStateData").val().split(",");
        jurisdictionType = `Z${$('#selIssueState').find('option:selected').val().charAt(0)}`;
        jurisdictionString = `${jurisdictionType}`;

        consoleString += jurisdictionString;

        if (jurisdictionData.length === 0) {
            jurisdictionData = ["","",""];
        }

        for (let i = 0; i < jurisdictionData.length && i < 26; i++){
            if (i < jurisdictionData.length-1) {
                jurisdictionString += `${jurisdictionType}${String.fromCharCode(65+i)}${jurisdictionData[i].toString().trim().toUpperCase()}${AAMVA_DATA_ELEMENT_SEPERATOR}`;
                consoleString += `${jurisdictionType}${String.fromCharCode(65+i)}${jurisdictionData[i].toString().trim().toUpperCase()}<DataElementSeperator>`;
            } else {
                jurisdictionString += `${jurisdictionType}${String.fromCharCode(65+i)}${jurisdictionData[i].toString().trim().toUpperCase()}${AAMVA_SEGMENT_TERMINATOR}`;
                consoleString += `${jurisdictionType}${String.fromCharCode(65+i)}${jurisdictionData[i].toString().trim().toUpperCase()}<SegmentTerminator>`;
                }
            }

            console.log(consoleString);

            recordOffset = `XXXX`;
            recordLength = `0000${subfileString.length.toString()}`.slice(-4);

            jurisdictionOffset = `AAAA`;
            jurisdictionLength = `0000${jurisdictionString.length.toString()}`.slice(-4);

            let header = `${AAMVA_COMPLIANCE_INDICATOR}${AAMVA_DATA_ELEMENT_SEPERATOR}${AAMVA_RECORD_SEPERATOR}${AAMVA_SEGMENT_TERMINATOR}${AAMVA_FILE_TYPE}${aamvaIIN}${AAMVA_VERSION}${AAMVA_JURISDICTION_VERSION}${AAMVA_ENTRIES}${aamvaSubfileType}`
            console.log(`header = ${header}`);

            recordOffset = (header.length+recordOffset.length+recordLength.length+jurisdictionType.length+jurisdictionOffset.length+jurisdictionLength.length).toString();
            recordOffset = `0000${recordOffset}`.slice(-4);
            jurisdictionOffset = `0000${((Number(recordOffset)) + (Number(recordLength))).toString()}`.slice(-4);

            let subfileDescriptor = `${recordOffset}${recordLength}${jurisdictionType}${jurisdictionOffset}${jurisdictionLength}`;
            console.log(`subfile descriptor = ${subfileDescriptor}`);

            let aamva = `${header}${subfileDescriptor}${subfileString}${jurisdictionString}`;
            console.log(`aamva = ${aamva}`);

            $.fn.generatePDF417(aamva);

            if ($('#chkMake1DBarcode').is(':checked')) {
                let inventoryNum = $("#txtInventoryNum").val();
                if (inventoryNum) {
                    $.fn.generateCode128(inventoryNum);
                    $("#code128-card").show();
                } else {
                    $("#code128-card").hide();
                }
            } else {
                $("#code128-card").hide();
            }

            $('#output').show();
            $('html, body').animate({ scrollTop: $('#output').offset().top - 20 }, 400);
    },

    generatePDF417: function(input) {
        PDF417.init(input, 5);

        let barcode = PDF417.getBarcodeArray();
        let scale = 3;
        let bw = scale;
        let bh = scale * 3;
        let canvas = document.getElementById('pdf417-canvas');
        canvas.width = bw * barcode['num_cols'];
        canvas.height = bh * barcode['num_rows'];

        let ctx = canvas.getContext('2d');

        // Fill background based on toggle state
        if (!$('#chkTransparentBg').is(':checked')) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        var y = 0;
        for (var r = 0; r < barcode['num_rows']; ++r) {
            var x = 0;
            for (var c = 0; c < barcode['num_cols']; ++c) {
                if (barcode['bcode'][r][c] == 1) {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(x, y, bw, bh);
                }
                x += bw;
            }
            y += bh;
        }
    },

    generateCode128: function(input) {
        let transparent = $('#chkTransparentBg').is(':checked');
        JsBarcode("#code128", input, {
            format: "CODE128",
            width: 3,
            height: 80,
            displayValue: true,
            fontSize: 16,
            margin: 15,
            background: transparent ? "transparent" : "#ffffff",
            lineColor: "#000000"
        });
    },

    downloadCanvas: function(canvasId, filename) {
        let canvas = document.getElementById(canvasId);
        let link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    },

    downloadSVG: function(svgId, filename) {
        let svg = document.getElementById(svgId);
        let svgData = new XMLSerializer().serializeToString(svg);
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let img = new Image();

        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            let link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    },

    redrawPDF417Transparent: function() {
        let canvas = document.getElementById('pdf417-canvas');
        let ctx = canvas.getContext('2d');
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;
        // Make white pixels transparent
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] === 255 && data[i+1] === 255 && data[i+2] === 255) {
                data[i+3] = 0;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    },

    redrawPDF417White: function() {
        // Re-generate to get white background back
        // We store the last encoded data so we can re-render
        let canvas = document.getElementById('pdf417-canvas');
        let ctx = canvas.getContext('2d');
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;
        // Make transparent pixels white
        for (let i = 0; i < data.length; i += 4) {
            if (data[i+3] === 0) {
                data[i] = 255;
                data[i+1] = 255;
                data[i+2] = 255;
                data[i+3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
});

$.validator.addMethod(
    "regex",
    function(value, element, regexp) {
        var re = new RegExp(regexp);
        return this.optional(element) || re.test(value);
    },
    "Please check your input."
);