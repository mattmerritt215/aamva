$(document).ready(() => {
  const ISSUERS_JSON = $.fn.getJSONData("dist/assets/json/issuers.json");
  $.each(ISSUERS_JSON, (i) => {
    $("#selIssueState").append(`<option value=${ISSUERS_JSON[i].abbreviation} data-iin=${ISSUERS_JSON[i].iin}>${ISSUERS_JSON[i].abbreviation}</option>`);
    $("#selAddressState").append(`<option value=${ISSERS_JSON[i].abbreviation}>${ISSUERS_JSON[i].abbreviation}</option>`);           
  });

    $("#selIssueState").change((e) => {
        let revDate = ISSUERS_JSON.find(issuer => issuer.abbreviation === $("#selIssueState").find("option:selected").val())?.revision_date || "";

        if (revDate !== "") {
            $("#txtRevisionDate").val(revDate);
            $("#txtRevisionDate").prop("readonly", true);
        }
    });

    $("#btnAdvanced").click((e) => {
        if ($("#advancedFields").hasClass("show")){
            $(this).removeClass("btn-primary");
            $(this).addClass("if-not-collapsed");
        } else {
            $(this).removeClass("if-not-collapsed");
            $(this).addClass("btn-primary");
        }

        $(this).find("i").toggleClass("bi bi-caret-down-fill bi bi-caret-up-fill");
    })

    $("#btnSubmit").click((e) => {
        e.preventDefault();
        $.fn.submit();
    })

    $("#btnReset").click((e) => {
        e.preventDefault();
        $.fn.resetForm();
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
        $('#input-form').find('input:text, input:date, select, textarea').val('');
        $('#input-form').find('input:radio').removeAttr('checked').removeAttr('selected');
        $('#pdf417').empty();
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
                subfileCharCount += subfileCharCount + key.length + value.toString().length + AAMVA_DATA_ELEMENT_SEPERATOR.length;
                i++;
            } else {
                subfileString += `${key}${value.toString().toUpperCase()}${AAMVA_SEGMENT_TERMINATOR}`;
                consoleString += `${key}${value.toString().toUpperCase()}<SegmentTerminator>`;
                subfileCharCount += subfileCharCount + key.length + value.toString().length + AAMVA_SEGMENT_TERMINATOR.length;
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
            $('.output-hidden').show();
    },

    generatePDF417: function(input) {
        PDF417.init(input, 5);

        let barcode = PDF417.getBarcodeArray();
        let bw = 2;
        let bh = 6;

        $("#pdf417").empty().append(`<a><canvas width="${bw * barcode['num_cols']}" height="${bh * barcode['num_rows']}"></canvas></a>`);

        $
        let ctx = $("#pdf417>a").children()[0].getContext('2d');

        var y = 0;
        for (var r = 0; r < barcode['num_rows']; ++r) {
            var x = 0;

            for (var c = 0; c < barcode['num_cols']; ++c) {
                ctx.fillStyle = 'white';
                if (barcode['bcode'][r][c] == 1) {
                    ctx.fillStyle = 'black';
                }
                ctx.fillRect(x,y,bw,bh);
                x += bw;
            }
            y += bh;
        }
    },

    getJSONData: function(url){
        fetch(url)
          .then((response) => response.json())
          .catch((error) => {
            console.error('Error fetching JSON data:', error);
          })
          .finally((data) => {return data;});
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
