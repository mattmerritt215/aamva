$(document).ready(() => {
  const ISSUERS_JSON = fetch("./assets/issuers.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Parse JSON
    }).catch((error) => console.error('Error fetching JSON:', error));

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
        $.fn.render();
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

    buildAamvaPayloadFromForm: function() {
        const AAMVA_COMPLIANCE_INDICATOR = "@";
        const AAMVA_DATA_ELEMENT_SEPERATOR = "010";
        const AAMVA_RECORD_SEPERATOR = "030";
        const AAMVA_SEGMENT_TERMINATOR = "013";
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
                subfileString += `${key}${value.toString().toUpperCase()}^${AAMVA_DATA_ELEMENT_SEPERATOR}`;
                consoleString += `${key}${value.toString().toUpperCase()}<DataElementSeperator>`;
                subfileCharCount += key.length + value.toString().length + String.fromCharCode(AAMVA_DATA_ELEMENT_SEPERATOR).length;
                i++;
            } else {
                subfileString += `${key}${value.toString().toUpperCase()}^${AAMVA_SEGMENT_TERMINATOR}`;
                consoleString += `${key}${value.toString().toUpperCase()}<SegmentTerminator>`;
                subfileCharCount += key.length + value.toString().length + String.fromCharCode(AAMVA_SEGMENT_TERMINATOR).length;
            }
        }

        console.log(`subfileCharCount = ${subfileCharCount}`);
        jurisdictionData=$("#txtStateData").val().split(",");
        jurisdictionType = `Z${$('#selIssueState').find('option:selected').val().charAt(0)}`;
        jurisdictionString = `${jurisdictionType}`;
        jurisdictionCharCount = jurisdictionString.length;

        consoleString += jurisdictionString;

        if (jurisdictionData.length === 0) {
            jurisdictionData = ["","",""];
        }

        for (let i = 0; i < jurisdictionData.length && i < 26; i++){
            if (i < jurisdictionData.length-1) {
                jurisdictionString += `${jurisdictionType}${String.fromCharCode(65+i)}${jurisdictionData[i].toString().trim().toUpperCase()}^${AAMVA_DATA_ELEMENT_SEPERATOR}`;
                consoleString += `${jurisdictionType}${String.fromCharCode(65+i)}${jurisdictionData[i].toString().trim().toUpperCase()}<DataElementSeperator>`;
                jurisdictionCharCount += `${jurisdictionType}${String.fromCharCode(65+i)}${jurisdictionData[i].toString().trim().toUpperCase()}`.length + String.fromCharCode(AAMVA_DATA_ELEMENT_SEPERATOR).length;
            } else {
                jurisdictionString += `${jurisdictionType}${String.fromCharCode(65+i)}${jurisdictionData[i].toString().trim().toUpperCase()}${AAMVA_SEGMENT_TERMINATOR}`;
                consoleString += `${jurisdictionType}${String.fromCharCode(65+i)}${jurisdictionData[i].toString().trim().toUpperCase()}<SegmentTerminator>`;
                jurisdictionCharCount += `${jurisdictionType}${String.fromCharCode(65+i)}${jurisdictionData[i].toString().trim().toUpperCase()}`.length + String.fromCharCode(AAMVA_SEGMENT_TERMINATOR).length;
                }
            }

            console.log(consoleString);

            recordOffset = `XXXX`;
            recordLength = `0000${subfileCharCount.toString()}`.slice(-4);

            jurisdictionOffset = `AAAA`;
            jurisdictionLength = `0000${jurisdictionCharCount.toString()}`.slice(-4);

            let header = `${AAMVA_COMPLIANCE_INDICATOR}^${AAMVA_DATA_ELEMENT_SEPERATOR}^${AAMVA_RECORD_SEPERATOR}^${AAMVA_SEGMENT_TERMINATOR}${AAMVA_FILE_TYPE}${aamvaIIN}${AAMVA_VERSION}${AAMVA_JURISDICTION_VERSION}${AAMVA_ENTRIES}${aamvaSubfileType}`
            let headerLength = `${AAMVA_COMPLIANCE_INDICATOR}`.length + String.fromCharCode(AAMVA_DATA_ELEMENT_SEPERATOR).length + String.fromCharCode(AAMVA_RECORD_SEPERATOR).length + String.fromCharCode(AAMVA_SEGMENT_TERMINATOR).length + `${AAMVA_FILE_TYPE}${aamvaIIN}${AAMVA_VERSION}${AAMVA_JURISDICTION_VERSION}${AAMVA_ENTRIES}${aamvaSubfileType}`.length;
            console.log(`header = ${header}`);

            recordOffset = (headerLength+recordOffset.length+recordLength.length+jurisdictionType.length+jurisdictionOffset.length+jurisdictionLength.length).toString();
            recordOffset = `0000${recordOffset}`.slice(-4);
            jurisdictionOffset = `0000${((Number(recordOffset)) + (Number(recordLength))).toString()}`.slice(-4);

            let subfileDescriptor = `${recordOffset}${recordLength}${jurisdictionType}${jurisdictionOffset}${jurisdictionLength}`;
            console.log(`subfile descriptor = ${subfileDescriptor}`);

            let aamva = `${header}${subfileDescriptor}${subfileString}${jurisdictionString}`;
            console.log(`aamva = ${aamva}`);
    },

    getBarcodePNG: async (endpoint, text) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!res.ok) throw new Error(await res.text());
      return await res.blob(); 
    },

    render: async () => {
      const payload = $.fn.buildAamvaPayloadFromForm();
      const pdf417Blob = await $.fn.getBarcodePNG('/api/barcode/pdf417', payload);
            
      $('#pdf417').html(`<img src="${URL.createObjectURL(pdf417Blob)}" alt="PDF417 Barcode">`);

      if ($('#chkMake1DBarcode').is(':checked')) {
        const code128Blob = await $.fn.getBarcodePNG('/api/barcode/code128', payload);  
        $('#code128').html(`<img src="${URL.createObjectURL(code128Blob)}" alt="Code128 Barcode">`);
      }

      $('#output').show();
    },

    getJSONData: (url) => {
      return fetch(url)
        .then((response) => response.json())
        .catch((error) => {
          console.error('Error fetching JSON data:', error);
        });
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
