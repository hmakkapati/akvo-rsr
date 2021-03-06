/** @jsx React.DOM */

// Akvo RSR is covered by the GNU Affero General Public License.
// See more details in the license.txt file located at the root folder of the
// Akvo RSR module. For additional details on the GNU license please see
// < http://www.gnu.org/licenses/agpl.html >.

// DEFAULT VALUES
var defaultValues = JSON.parse(document.getElementById("default-values").innerHTML);
var countryValues = JSON.parse(document.getElementById("country-values").innerHTML);

// CSRF TOKEN
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var csrftoken = getCookie('csrftoken');

// TYPEAHEADS
var MAX_RETRIES = 2;
var projectsAPIUrl = '/rest/v1/typeaheads/projects?format=json';
var orgsAPIUrl = '/rest/v1/typeaheads/organisations?format=json';
var responses = {};
responses[projectsAPIUrl] = null;
responses[orgsAPIUrl] = null;

// LOCAL STORAGE
var MAX_LOCALSTORAGE_DAYS = 30;
var MAX_LOCALSTORAGE_AGE = MAX_LOCALSTORAGE_DAYS * 24 * 60 * 60 * 1000;
var localStorageName = 'cachedAPIResponses';
var localStorageResponses = localStorage.getItem(localStorageName);

// PARTIALS
var partials = ['related-project', 'budget-item', 'condition', 'contact-information',
    'country-budget-item','document', 'indicator', 'indicator-period', 'link', 'partner',
    'planned-disbursement', 'policy-marker', 'recipient-country', 'recipient-region',
    'related-project','result', 'sector', 'transaction', 'transaction-sector',
    'location-administrative', 'project-location', 'keyword'];
var partialsCount = {};

// Measure the percentage of completion for each panel and display the results to the user
// Which elements count as inputs?
var INPUT_ELEMENTS = ['input', 'select', 'textarea'];

// Add a class selector here if you only want inputs with a certain class to count
// towards the completion percentage. If left blank, all inputs will count.
var MEASURE_CLASS = '.priority1';

function findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el;
}

function startSave(step) {
    var div, div_id, div_button_id, div_button;

    div_id = 'savingstep' + step;
    div = document.getElementById(div_id);

    div_button_id = 'savingstep' + step + '-button';
    div_button = document.getElementById(div_button_id);

    div_button.setAttribute('disabled', '');
    div.innerHTML = '<div class="help-block">Saving...</div>';
}

function finishSave(step, message) {
    var div, div_id, div_button_id, div_button, message_time;

    div_id = 'savingstep' + step;
    div = document.getElementById(div_id);

    div_button_id = 'savingstep' + step + '-button';
    div_button = document.getElementById(div_button_id);

    // Show error message 20 seconds, other messages only 5 seconds
    if (message.indexOf('class="help-block-error"') > -1) {
        message_time = 20000;
    } else {
        message_time = 5000;
    }

    // Only replace the message if no error is shown yet
    if (div.innerHTML.indexOf('class="help-block-error"') === -1) {
        div.innerHTML = message;

        setTimeout(function () {
            div.innerHTML = '';
            div_button.removeAttribute('disabled');
        }, message_time);
    }
}

function removeErrors(form) {
    var error_elements, form_elements;

    error_elements = form.getElementsByClassName('help-block-error');
    form_elements = form.getElementsByClassName('has-error');

    while (error_elements.length > 0) {
        error_elements[0].parentNode.removeChild(error_elements[0]);
    }

    while (form_elements.length > 0) {
        form_elements[0].className = form_elements[0].className.replace('has-error', '');
    }
}

function addErrors(errors) {
    for (var i = 0; i < errors.length; i++) {
        try {
            var error, errorNode, textnode;

            error = errors[i];

            errorNode = document.getElementById(error.name);

            if (errorNode.className.indexOf('-container') === -1) {
                errorNode = errorNode.parentNode;

            }

            if (errorNode.className.indexOf('input-group') > -1) {
                errorNode = errorNode.parentNode;
            }

            errorNode.className += ' has-error';

            var pNode = document.createElement("p");
            pNode.className = "help-block help-block-error";
            textnode = document.createTextNode(error.error);
            pNode.appendChild(textnode);
            errorNode.appendChild(pNode);

            if (i === 0) {
                document.getElementById(error.name).scrollIntoView();
                window.scrollBy(0, -100);
            }
        } catch (tryError) {
            // Can't find attribute, probably due to a name change
        }
    }
}

function replaceNames(newObjects, excludeClass) {
    for (var i = 0; i < newObjects.length; i++) {
        var parentNode, newParentNodeId, otherParents, inputs, selects, textareas, excludedInputs, excludedSelects, excludedTextareas;

        parentNode = document.getElementById(newObjects[i].div_id);
        newParentNodeId = parentNode.getAttributeNode("id").value.replace(newObjects[i].old_id, newObjects[i].new_id);
        parentNode.setAttribute("id", newParentNodeId);

        otherParents = parentNode.querySelectorAll('.parent');

        try {
            var newUnicode, unicodeNode;

            newUnicode = newObjects[i].unicode;
            unicodeNode = parentNode.getElementsByClassName('unicode')[0];

            unicodeNode.innerHTML = newUnicode;
        } catch (error) {
            // No new unicode
        }

        if (excludeClass === undefined) {

            inputs = parentNode.querySelectorAll('input');
            selects = parentNode.querySelectorAll('select');
            textareas = parentNode.querySelectorAll('textarea');

            excludedInputs = [];
            excludedSelects = [];
            excludedTextareas = [];
        } else {
            inputs = parentNode.querySelectorAll('input:not(.' + excludeClass + ')');
            selects = parentNode.querySelectorAll('select:not(.' + excludeClass + ')');
            textareas = parentNode.querySelectorAll('textarea:not(.' + excludeClass + ')');

            excludedInputs = parentNode.querySelectorAll('input.' + excludeClass);
            excludedSelects = parentNode.querySelectorAll('select.' + excludeClass);
            excludedTextareas = parentNode.querySelectorAll('textarea.' + excludeClass);
        }

        for (var j=0; j < inputs.length; j++) {
            var newInputId = inputs[j].getAttributeNode("id").value.replace(newObjects[i].old_id, newObjects[i].new_id);
            inputs[j].setAttribute("id", newInputId);
            inputs[j].setAttribute("name", newInputId);
        }

        for (var k=0; k < selects.length; k++) {
            var newSelectId = selects[k].getAttributeNode("id").value.replace(newObjects[i].old_id, newObjects[i].new_id);
            selects[k].setAttribute("id", newSelectId);
            selects[k].setAttribute("name", newSelectId);
        }

        for (var l=0; l < textareas.length; l++) {
            var newTextareaId = textareas[l].getAttributeNode("id").value.replace(newObjects[i].old_id, newObjects[i].new_id);
            textareas[l].setAttribute("id", newTextareaId);
            textareas[l].setAttribute("name", newTextareaId);
        }

        for (var m=0; m < excludedInputs.length; m++) {
            if (!(excludedInputs[m].hasAttribute(excludeClass))) {
                var newExcludedInputId = excludedInputs[m].getAttributeNode("id").value + '-' + newObjects[i].new_id;
                excludedInputs[m].setAttribute("id", newExcludedInputId);
                excludedInputs[m].setAttribute("name", newExcludedInputId);
                excludedInputs[m].setAttribute(excludeClass, "");
            }
        }

        for (var n=0; n < excludedSelects.length; n++) {
            if (!(excludedSelects[n].hasAttribute(excludeClass))) {
                var newExcludedSelectId = excludedSelects[n].getAttributeNode("id").value + '-' + newObjects[i].new_id;
                excludedSelects[n].setAttribute("id", newExcludedSelectId);
                excludedSelects[n].setAttribute("name", newExcludedSelectId);
                excludedSelects[n].setAttribute(excludeClass, "");
            }
        }

        for (var o=0; o < excludedTextareas.length; o++) {
            if (!(excludedTextareas[o].hasAttribute(excludeClass))) {
                var newExcludedTextareaId = excludedTextareas[o].getAttributeNode("id").value + '-' + newObjects[i].new_id;
                excludedTextareas[o].setAttribute("id", newExcludedTextareaId);
                excludedTextareas[o].setAttribute("name", newExcludedTextareaId);
                excludedTextareas[o].setAttribute(excludeClass, "");
            }
        }

        for (var p=0; p < otherParents.length; p++) {
            if (!(otherParents[p].hasAttribute(excludeClass))) {
                var newOtherParentId = otherParents[p].getAttributeNode("id").value + '-' + newObjects[i].new_id;
                otherParents[p].setAttribute("id", newOtherParentId);
                otherParents[p].setAttribute(excludeClass, "");
            }
        }
    }
}

function replacePhoto(photo) {
    if (photo !== null) {
        var img_photo, photo_container, add_html;

        img_photo = document.querySelector('#img-photo');

        if (img_photo !== null) {
            var delete_link;

            img_photo.parentNode.removeChild(img_photo);
            delete_link = document.querySelector('#delete-photo');

            if (delete_link !== null) {
                delete_link.parentNode.removeChild(delete_link);
            }
        }

        photo_container = document.querySelector('#photo-container');
        add_html = '<img src="' + photo + '" class="current-project-photo" id="img-photo"><a class="btn btn-link delete-photo-button" id="delete-photo"><span class="glyphicon glyphicon-remove"></span> Delete photo</a>';

        photo_container.innerHTML = add_html + photo_container.innerHTML;

        setDeletePhoto();
    }
}

function replaceTotalBudget(total_budget) {
    var totalBudgetNode;

    totalBudgetNode = document.getElementById('total-budget');
    totalBudgetNode.innerHTML = total_budget;
}

function saveDocuments(form, api_url, step, new_objects) {
    var documentFormData, documents, file_request;

    documentFormData = new FormData();
    documents = form.querySelectorAll('*[id^="document-document-"]');

    for (var i=0; i < documents.length; i++) {
        var document_id, document_files;
        document_id = documents[i].getAttribute("id");
        document_files = document.getElementById(document_id).files;

        if (document_files !== undefined) {
            documentFormData.append(document_id, document_files[0]);
        }
    }

    file_request = new XMLHttpRequest();
    file_request.open("POST", api_url);
    file_request.setRequestHeader("X-CSRFToken", csrftoken);

    file_request.onload = function() {
        var message;

        if (file_request.status >= 200 && file_request.status < 400) {
            var response;

            response = JSON.parse(file_request.responseText);
            addErrors(response.errors);

            if (response.errors.length > 0) {
                message = '<div class="help-block-error"><span class="glyphicon glyphicon-remove-circle"></span> Error while saving document</div>';
                finishSave(step, message);
            }

            return false;
        } else {
            // We reached our target server, but it returned an error
            message = '<div class="help-block-error"><span class="glyphicon glyphicon-remove-circle"></span> Something went wrong with your request</div>';

            finishSave(step, message);
            return false;
        }
    };

    file_request.onerror = function() {
        // There was a connection error of some sort
        var message;

        message = '<div class="help-block-error"><span class="glyphicon glyphicon-remove-circle"></span> Connection error, check your internet connection</div>';

        finishSave(step, message);
        return false;
    };

    file_request.send(documentFormData);
}

function submitStep(step, level) {
    var api_url, form, form_data, form_div, request, file_request, message;

    // Collect form data
    form_div = '#admin-step-' + step;
    form = document.querySelector(form_div);
    form_data = serialize(form);

    if (level === undefined || level === 1) {
        // Indicate saving has started
        startSave(step);
        removeErrors(form);
    }

    // Custom code per step
    if (step === '1') {
        var related_projects = form.getElementsByClassName('related-project-input');

        for (var i=0; i < related_projects.length; i++) {
            var input, input_id, input_value;

            input = related_projects[i].getElementsByTagName('input')[0];
            input_id = input.getAttribute("id");
            if (input.value !== '') {
                input_value = input.getAttribute("value");
            } else {
                input_value = '';
            }

            form_data += '&value-' + input_id + '=' + input_value;
        }
    } else if (step === '3') {
        var partners = form.getElementsByClassName('partner-input');

        for (var j=0; j < partners.length; j++) {
            var partner_input, partner_input_id, partner_input_value;

            partner_input = partners[j].getElementsByTagName('input')[0];
            partner_input_id = partner_input.getAttribute("id");
            if (partner_input.value !== '') {
                partner_input_value = partner_input.getAttribute("value");
            } else {
                partner_input_value = '';
            }

            form_data += '&value-' + partner_input_id + '=' + partner_input_value;
        }
    } else if (step === '5') {
        form_data += '&level=' + level;
    } else if (step === '6') {
        var receiverOrgs, providerOrgs;

        receiverOrgs = form.getElementsByClassName('transaction-receiver-org-input');
        providerOrgs = form.getElementsByClassName('transaction-provider-org-input');

        for (var o=0; o < receiverOrgs.length; o++) {
            var receiver_org_input, receiver_org_input_id, receiver_org_input_value;

            receiver_org_input = receiverOrgs[o].getElementsByTagName('input')[0];
            receiver_org_input_id = receiver_org_input.getAttribute("id");
            if (receiver_org_input.value !== '') {
                receiver_org_input_value = receiver_org_input.getAttribute("value");
            } else {
                receiver_org_input_value = '';
            }

            form_data += '&value-' + receiver_org_input_id + '=' + receiver_org_input_value;
        }

        for (var p=0; p < providerOrgs.length; p++) {
            var provider_org_input, provider_org_input_id, provider_org_input_value;

            provider_org_input = providerOrgs[p].getElementsByTagName('input')[0];
            provider_org_input_id = provider_org_input.getAttribute("id");
            if (provider_org_input.value !== '') {
                provider_org_input_value = provider_org_input.getAttribute("value");
            } else {
                provider_org_input_value = '';
            }

            form_data += '&value-' + provider_org_input_id + '=' + provider_org_input_value;
        }

        form_data += '&level=' + level;
    } else if (step === '7') {
        form_data += '&level=' + level;
    }

    // Boolean custom fields
    var booleanCustomFields = form.getElementsByClassName('boolean-custom-field');
    for (var q=0; q < booleanCustomFields.length; q++) {
        var custom_field, custom_field_id;

        custom_field = booleanCustomFields[q];
        custom_field_id = custom_field.getAttribute('id');

        if (custom_field.checked) {
            form_data = form_data.replace(custom_field_id + '=on', custom_field_id + '=True');
        } else {
            form_data += '&' + custom_field_id + '=False';
        }
    }

    // Create request
    api_url = '/rest/v1/project/' + defaultValues.project_id + '/step_' + step + '/?format=json';

    request = new XMLHttpRequest();
    request.open('POST', api_url, true);
    request.setRequestHeader("X-CSRFToken", csrftoken);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var response;
            response = JSON.parse(request.responseText);

            // Add errors
            if (response.errors.length > 0) {
                message = '<div class="help-block-error"><span class="glyphicon glyphicon-remove-circle"></span> Error while saving</div>';
            } else {
                message = '<div class="save-success"><span class="glyphicon glyphicon-ok-circle"></span> Saved successfully!</div>';
            }
            addErrors(response.errors);

            // Replace saved values
            for (var i=0; i < response.changes.length; i++) {
                var formElement;

                formElement = document.getElementById(response.changes[i][0]);
                formElement.setAttribute('saved-value', response.changes[i][1]);
            }

            if (step === '5' && level === 1) {
                replaceNames(response.rel_objects, 'indicator');
            } else if (step === '5' && level === 2) {
                replaceNames(response.rel_objects, 'indicator-period');
            } else if (step === '6' && level === 1) {
                replaceNames(response.rel_objects, 'sector');
                replaceTotalBudget(response.total_budget);
            } else if (step === '7' && level === 1) {
                replaceNames(response.rel_objects, 'administrative');
            }  else {
                replaceNames(response.rel_objects);
            }

            if (step === '5' && level < 3) {
                submitStep('5', level + 1);
            }

            if (step === '6' && level < 2) {
                submitStep('6', level + 1);
            }

            if (step === '7' && level < 2) {
                submitStep('7', level + 1);
            }

            if (step === '9') {
                saveDocuments(form, api_url, step, response.new_objects);
            }

            var section = findAncestor(form, 'formStep');
            setSectionCompletionPercentage(section);
            setPageCompletionPercentage();

            finishSave(step, message);

            return false;
        } else {
            // We reached our target server, but it returned an error
            message = '<div class="help-block-error"><span class="glyphicon glyphicon-remove-circle"></span> Something went wrong while saving</div>';

            finishSave(step, message);
            return false;
        }
    };

    request.onerror = function() {
        // There was a connection error of some sort
        message = '<div class="help-block-error"><span class="glyphicon glyphicon-remove-circle"></span> Connection error, check your internet connection</div>';

        finishSave(step, message);
        return false;
    };

    request.send(form_data);

    if (step === '1') {
        var formData = new FormData();
        formData.append("photo", document.getElementById("photo").files[0]);

        file_request = new XMLHttpRequest();
        file_request.open("POST", api_url);
        file_request.setRequestHeader("X-CSRFToken", csrftoken);

        file_request.onload = function() {
            if (file_request.status >= 200 && file_request.status < 400) {
                var response;

                removeErrors(form);
                response = JSON.parse(file_request.responseText);
                replacePhoto(response.new_image);
                addErrors(response.errors);

                if (response.errors.length > 0) {
                    message = '<div class="help-block-error"><span class="glyphicon glyphicon-remove-circle"></span> Error while saving photo</div>';
                    finishSave(step, message);
                }
                return false;
            } else {
                // We reached our target server, but it returned an error
                message = '<div class="help-block-error"><span class="glyphicon glyphicon-remove-circle"></span> Something went wrong while saving</div>';

                if (file_request.status == 413) {
                    // Image is too big
                    addErrors([{"name": "photo", "error": "Photo is too big, please upload a photo that is smaller than 2 MB."}]);
                }

                finishSave(step, message);
                return false;
            }
        };

        file_request.onerror = function() {
            // There was a connection error of some sort
            message = '<div class="help-block-error"><span class="glyphicon glyphicon-remove-circle"></span> Connection error, check your internet connection</div>';

            finishSave(step, message);
            return false;
        };

        file_request.send(formData);
    }
}

function deleteItem(itemId, itemType, parentDiv) {
    var request;

    // Create request
    request = new XMLHttpRequest();
    request.open('DELETE', '/rest/v1/' + itemType + '/' + itemId + '/?format=json', true);
    request.setRequestHeader("X-CSRFToken", csrftoken);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            parentDiv.parentNode.removeChild(parentDiv);

            // Update the budget in case of removed budget
            if (itemType === 'budget_item') {
                getTotalBudget();
            }

            return false;
        } else {
            // We reached our target server, but it returned an error
            return false;
        }
    };

    request.onerror = function() {
        // There was a connection error of some sort
        return false;
    };

    request.send();
}

function setDeletePhoto() {
    try {
        var deletePhotoButton;

        deletePhotoButton = document.getElementById('delete-photo');
        deletePhotoButton.onclick = getDeletePhoto();

    } catch (error) {
        // No delete photo button
        return false;
    }
}

function getDeletePhoto() {
    return function(e) {
        e.preventDefault();
        deletePhoto();
    };
}

function deletePhoto() {
    var api_url, request;

    // Create request
    api_url = '/rest/v1/project/' + defaultValues.project_id + '/delete_photo/?format=json';

    request = new XMLHttpRequest();
    request.open('POST', api_url, true);
    request.setRequestHeader("X-CSRFToken", csrftoken);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var imgNode, aNode, inputNode;

            imgNode = document.getElementById('img-photo');
            imgNode.parentNode.removeChild(imgNode);

            aNode = document.getElementById('delete-photo');
            aNode.parentNode.removeChild(aNode);

            inputNode = document.getElementById('photo');
            inputNode.setAttribute('default', '');

            setAllSectionsCompletionPercentage();

            return false;
        } else {
            // We reached our target server, but it returned an error
            return false;
        }
    };

    request.onerror = function() {
        // There was a connection error of some sort
        return false;
    };

    request.send();
}

function deleteDocument(document_id) {
    var api_url, request;

    // Create request
    api_url = '/rest/v1/project/' + defaultValues.project_id + '/delete_document/' + document_id + '/?format=json';

    request = new XMLHttpRequest();
    request.open('POST', api_url, true);
    request.setRequestHeader("X-CSRFToken", csrftoken);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var docNode, aNode;

            docNode = document.querySelector('#document-document-url-' + document_id);
            docNode.parentNode.removeChild(docNode);

            aNode = document.querySelector('#delete-document-document-' + document_id);
            aNode.parentNode.removeChild(aNode);

            return false;
        } else {
            // We reached our target server, but it returned an error
            return false;
        }
    };

    request.onerror = function() {
        // There was a connection error of some sort
        return false;
    };

    request.send();
}

function getTotalBudget() {
    var api_url, request;

    // Create request
    api_url = '/rest/v1/project/' + defaultValues.project_id + '/?format=json';

    request = new XMLHttpRequest();
    request.open('GET', api_url, true);
    request.setRequestHeader("X-CSRFToken", csrftoken);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var response;

            response = JSON.parse(request.responseText);
            try {
                replaceTotalBudget(response.budget);
            } catch (error) {
                return false;
            }
        } else {
            // We reached our target server, but it returned an error
            return false;
        }
    };

    request.onerror = function() {
        // There was a connection error of some sort
        return false;
    };

    request.send();
}

function confirmRemove(idArray, parentDiv) {
    return function(e) {
        e.preventDefault();

        var itemId, itemType;

        itemId = idArray[idArray.length - 1];
        idArray.pop();
        itemType = idArray.join();

        if (itemType === 'keyword') {
            itemType = 'project/' + defaultValues.project_id + '/remove_keyword';
        }

        deleteItem(itemId, itemType, parentDiv);
    };
}

function dismissRemove(nodeClass, nodeId, parentNode, sureNode) {
    return function(e) {
        e.preventDefault();

        var node, trashCan;

        parentNode.removeChild(sureNode);

        node = document.createElement('a');

        node.setAttribute('class', nodeClass);
        node.setAttribute('id', nodeId);
        node.onclick = setRemovePartial(node);

        trashCan = document.createElement('span');
        trashCan.setAttribute('class', 'glyphicon glyphicon-trash');

        node.appendChild(trashCan);
        parentNode.appendChild(node);
    };
}

function removePartial(node) {
    var parentDiv, idArray, parentParent;

    parentDiv = findAncestor(node, "parent");
    idArray = parentDiv.getAttributeNode("id").value.split("-");
    parentParent = parentDiv.parentNode;

    if (idArray[idArray.length - 2] === 'add') {
        // New object, not saved to the DB, so partial can be directly deleted
        parentDiv.parentNode.removeChild(parentDiv);
    } else {
        // Show warning first
        var nodeClass, nodeId, noNode, parentNode, sureNode, yesNode;

        nodeClass = node.getAttribute('class');
        nodeId = node.getAttribute('id');

        parentNode = node.parentNode;
        parentNode.removeChild(node);

        sureNode = document.createElement('div');
        sureNode.innerHTML = "Are you sure?";

        yesNode = document.createElement('a');
        yesNode.setAttribute('style', 'color: green; margin-left: 5px;');
        yesNode.onclick = confirmRemove(idArray, parentDiv);
        yesNode.innerHTML = 'Yes';

        noNode = document.createElement('a');
        noNode.setAttribute('style', 'color: red; margin-left: 5px;');
        noNode.onclick = dismissRemove(nodeClass, nodeId, parentNode, sureNode);
        noNode.innerHTML = 'No';

        sureNode.appendChild(yesNode);
        sureNode.appendChild(noNode);
        parentNode.appendChild(sureNode);
    }

    // Update the progress bars to account for the removed inputs
    setSectionCompletionPercentage(findAncestor(parentParent, "formStep"));
}

function buildReactComponents(typeaheadOptions, typeaheadCallback, displayOption, selector, childClass, valueId, label, help, filterOption, inputType) {
    var Typeahead, TypeaheadLabel, TypeaheadContainer, selectorTypeahead, selectorClass, inputClass, typeaheadInput;
    Typeahead = ReactTypeahead.Typeahead;

    if (inputType === 'project') {
        typeaheadOptions.forEach(function(o) {
            o.filterOption = o.id + ' ' + o.title;
            o.displayOption = o.title + ' (ID: ' + o.id + ')';
        });
        filterOption = 'filterOption';
        displayOption = 'displayOption';
    } else if (inputType === 'org') {
        typeaheadOptions.forEach(function(o) {
            var newName = getDisplayOption(o.name, o.long_name);

            o.filterOption = o.name + ' ' + o.long_name;
            o.displayOption = newName;
        });        
        filterOption = 'filterOption';
        displayOption = 'displayOption';
    }

    function getDisplayOption(short, long) {
        if (short === long) {
            return short;
        }
        if (!long) {
            return short;
        }
        return short + ' (' + long + ')';
    }
    inputClass = selector + " form-control " + childClass;

    selectorClass = document.querySelector('.' + selector);

    TypeaheadContainer = React.createClass({displayName: 'TypeaheadContainer',

        getInitialState: function() {
            return ({focusClass: 'inactive'});
        },
        onKeyUp: function() {

            /* Only activate the "add org" button for typeaheads that are for organisations. */
            if (inputType === 'org') {
                this.setState({focusClass: 'active'});
            }
        },
        onBlur: function() {
            this.setState({focusClass: 'inactive'});
        },
        render: function() {
            return (
                    React.DOM.div( {className:this.state.focusClass}, 
                        Typeahead(
                            {placeholder:"",
                            options:typeaheadOptions,
                            onOptionSelected:typeaheadCallback,
                            maxVisible:10,
                            displayOption:displayOption,
                            filterOption:filterOption,
                            childID:selector,
                            onKeyUp:this.onKeyUp,
                            onBlur:this.onBlur,
                            customClasses:{
                              typeahead: "",
                              input: inputClass,
                              results: "",
                              listItem: "",
                              token: "",
                              customAdd: ""
                            },
                            inputProps:{
                                name: selector,
                                id: selector
                            }} ),
                        React.DOM.div( {className:"addOrg", onMouseDown:addOrgModal}, "+ ", defaultValues.add_new_organisation)
                    )
            );
        }
    });

    React.render(
        TypeaheadContainer(null ),
        document.querySelector('.' + selector)
    );

    typeaheadInput = document.querySelector('.' + selector + ' .typeahead' + ' input');

    if (valueId !== null) {
        for (var i = 0; i < typeaheadOptions.length; i++) {
            if (parseInt(typeaheadOptions[i].id, 10) == parseInt(valueId, 10)) {
                var savedResult;

                savedResult = typeaheadOptions[i];

                typeaheadInput.value = savedResult[displayOption];
                typeaheadInput.setAttribute('value', savedResult.id);
                typeaheadInput.setAttribute('saved-value', savedResult.id);
            }
        }
    } else {
        typeaheadInput.setAttribute('saved-value', '');
    }

    selectorTypeahead = selectorClass.querySelector('.typeahead');
    selectorTypeahead.appendChild(label);
    selectorTypeahead.appendChild(help);
    elAddClass(selectorClass, 'has-typeahead');

    // Set mandatory markers before help icons
    var mandatoryMarkers = selectorClass.querySelectorAll('.mandatory');

    for (var i = 0; i < mandatoryMarkers.length; i++) {
        mandatoryMarkers[i].parentNode.removeChild(mandatoryMarkers[i]);
    }

    var mandatoryLabels = selectorClass.querySelectorAll('.priority1 ~ label');
    var markerSpan = document.createElement('span');

    elAddClass(markerSpan, 'mandatory');
    markerSpan.textContent = '*';

    for (var i = 0; i < mandatoryLabels.length; i++) {
        mandatoryLabels[i].appendChild(markerSpan);
    }

    updateHelpIcons('.' + selector);
    setAllSectionsCompletionPercentage();
    setAllSectionsChangeListerner();
    setPageCompletionPercentage();
}

function loadAsync(url, retryCount, retryLimit, callback, forceReloadOrg) {
    var xmlHttp;

    // If we already have the response cached, don't fetch it again
    if (responses[url] !== null && !forceReloadOrg) {
        callback(responses[url]);
        return;
    }

    // If the response is in localStorage, don't fetch it again
    if (localStorageResponses !== null && localStorageResponses !== '' && !forceReloadOrg) {
        if (localStorageResponses[url] !== undefined) {
            var response = localStorageResponses[url];

            if (isFresh(response.date, MAX_LOCALSTORAGE_AGE)) {
                callback(response.json);
                return;
            }
        }
    }

    function isFresh(writeDate, maxAge) {
        var currentDate, age;

        currentDate = new Date();
        currentDate = currentDate.getTime();
        age = currentDate - writeDate;

        return age <= maxAge;
    }

    xmlHttp = new XMLHttpRequest();

    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == XMLHttpRequest.DONE) {

            if (xmlHttp.status == 200){
                var response = JSON.parse(xmlHttp.responseText);
                responses[url] = response;
                updateLocalStorage(url, response);
                callback(response);
            } else {
                if (retryCount >= retryLimit) {
                    // we should load the project list from localstorage here
                    return false;
                } else {
                    retryCount = retryCount + 1;
                    loadAsync(url, retryCount, retryLimit, callback);
                }
            }
        } else {
            return false;
        }
    };

    xmlHttp.open("GET", url, true);
    xmlHttp.send();

    function updateLocalStorage(url, response) {
        var output, writeDate, lsData;

        if (localStorageResponses === null || localStorageResponses === '') {
            localStorageResponses = {};
        }

        output = {};

        writeDate = new Date();
        writeDate = writeDate.getTime();
        output.date = writeDate;
        output.json = response;

        localStorageResponses[url] = output;

        lsData = JSON.stringify(localStorageResponses);

        try {
            localStorage.setItem(localStorageName, lsData);
        } catch (error) {
            // Not enough space in local storage
            localStorage.setItem(localStorageName, JSON.stringify({}));
        }
    }
}

function processResponse(response, selector, childClass, valueId, label, help, filterOption, inputType) {
    var typeaheadOptions = response.results;
    var typeaheadCallback = function(option) {
        var el;

        el = document.querySelector('input.' + this.childID);
        el.setAttribute('value', option.id);
    };
    var displayOption = function(option, index) {
        return option[filterOption];
    };

    buildReactComponents(typeaheadOptions, typeaheadCallback, displayOption, selector, childClass, valueId, label, help, filterOption, inputType);
}

function getCallback(selector, childClass, valueId, label, help, filterOption, inputType) {
    var output = function(response) {
        processResponse(response, selector, childClass, valueId, label, help, filterOption, inputType);
    };

    return output;
}

function setSubmitOnClicks() {
    var forms;

    forms = document.getElementsByTagName('form');

    for (var i=0; i < forms.length; i++) {
        var stepId;

        stepId = forms[i].getAttribute('id').replace('admin-step-', '');
        forms[i].onsubmit = getFormSubmit(stepId);
    }
}

function getFormSubmit(stepId) {
    return function(e) {
        e.preventDefault();
        if (stepId === '5' || '6' || '7') {
            submitStep(stepId, 1);
        } else {
            submitStep(stepId);
        }
    };
}

function setPartialOnClicks() {
    for (var i=0; i < partials.length; i++) {
        var pName = partials[i];
        var buttonSelector = '.add-' + pName;
        var buttons = document.querySelectorAll(buttonSelector);

        for (var j = 0; j < buttons.length; j++) {
            var el = buttons[j];
            var callback;

            if (elHasClass(el, 'has-onclick')) {

                // already set the onclick, do nothing
                continue;
            }

            elAddClass(el, 'has-onclick');
            callback = getOnClick(pName, el.parentNode.parentNode.parentNode);
            el.addEventListener('click', callback);
        }
    }

    var removeLinks;

    removeLinks = document.getElementsByClassName('delete-object-button');

    for (var j=0; j < removeLinks.length; j++) {
        var removeLink;

        removeLink = removeLinks[j];
        removeLink.onclick = setRemovePartial(removeLink);
    }

    var hidePartials;

    hidePartials = document.getElementsByClassName('hide-partial-click');

    for (var k=0; k < hidePartials.length; k++) {
        hidePartials[k].onclick = togglePartial(hidePartials[k]);
    }
}

function togglePartial(hidePartial) {
    return function(e) {
        e.preventDefault();

        var partialToHide, foldedIndicator, fold;

        partialToHide = hidePartial.parentNode.parentNode.getElementsByClassName('hide-partial')[0];
        foldedIndicator = hidePartial.getElementsByClassName('folded-sign')[0];

        if (foldedIndicator.innerHTML === '-') {
            foldedIndicator.innerHTML = '+';
            partialToHide.className += ' hidden';
        } else {
            foldedIndicator.innerHTML = '-';
            partialToHide.className = partialToHide.className.replace('hidden', '');
        }
    };
}

function getOnClick(pName, parentElement) {
    var onclick = function(e) {
        e.preventDefault();

        var markupSelector = '#' + pName + '-input';
        var containerSelector = pName + '-container';
        var container = parentElement.querySelector('#' + containerSelector);

        var markup = document.querySelector(markupSelector).innerHTML;

        var partial = document.createElement('div');
        partial.innerHTML = markup;

        var parents = partial.querySelectorAll('div.parent');

        for (var i = 0; i < parents.length; i++) {
            var parent = parents[i];
            var oldID = parent.getAttribute('id');
            var newID = oldID + '-add-' + partialsCount[pName];
            parent.setAttribute('id', newID);
        }

        var longSelector = 'input, select, textarea';

        var elements = partial.querySelectorAll(longSelector);

        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];

            addCountToName(el);
        }

        var datePickerContainers = partial.querySelectorAll('.datepicker-container');

        for (var i = 0; i < datePickerContainers.length; i++) {
            var el = datePickerContainers[i];

            addCountToDate(el);
        }

        var typeaheadContainers = partial.querySelectorAll('.typeahead-container');

        for (var i = 0; i < typeaheadContainers.length; i++) {
            var el = typeaheadContainers[i];

            addCountToClass(el);
        }

        function addCountToName(el) {
            var oldName = el.getAttribute('name');
            var newName = oldName + '-add-' + partialsCount[pName];

            el.setAttribute('name', newName);

            var oldID = el.getAttribute('id');
            var newID = oldID + '-add-' + partialsCount[pName];

            el.setAttribute('id', newID);
        }

        function addCountToDate(el) {
            var oldID = el.getAttribute('data-id');
            var newID = oldID + '-add-' + partialsCount[pName];

            el.setAttribute('data-id', newID);
        }

        // The typeahead containers need to have the unique identifying appended
        // to the class rather than the id, so handle that separately
        function addCountToClass(el) {
            var oldClass = el.getAttribute('data-count-class');
            var newClass = oldClass + '-add-' + partialsCount[pName];

            elRemoveClass(el, oldClass);
            elAddClass(el, newClass);

            el.setAttribute('data-child-id', newClass);
        }

        container.appendChild(partial);
        partialsCount[pName] += 1;

        // Add any datepickers and typeaheads, help icons and change listeners for the new project partial
        setDatepickers();
        updateTypeaheads();
        updateHelpIcons('.' + containerSelector);
        setSectionChangeListener(findAncestor(container, 'formStep'));
        setSectionCompletionPercentage(findAncestor(container, 'formStep'));
        setValidationListeners();

        // Set onClicks for partials again in case this partial contains other partials
        setPartialOnClicks();
    };

    return onclick;
}

function updateTypeaheads(forceReloadOrg) {
    var els, filterOption, labelText, helpText, API, inputType;

    els1 = document.querySelectorAll('.related-project-input');
    labelText = defaultValues.related_project_label;
    helpText = defaultValues.related_project_helptext;
    filterOption = 'title';
    API = projectsAPIUrl;
    inputType = 'project';

    updateTypeahead(els1, filterOption, labelText, helpText, API, inputType);

    els = document.querySelectorAll('.partner-input');
    labelText = defaultValues.partner_label;
    helpText = defaultValues.partner_helptext;
    filterOption = 'name';
    API = orgsAPIUrl;
    inputType = 'org';


    updateTypeahead(els, filterOption, labelText, helpText, API, inputType, forceReloadOrg);

    els = document.querySelectorAll('.transaction-provider-org-input');
    labelText = defaultValues.provider_org_label;
    helpText = defaultValues.provider_org_helptext;
    filterOption = 'name';
    API = orgsAPIUrl;
    inputType = 'org';


    updateTypeahead(els, filterOption, labelText, helpText, API, inputType, forceReloadOrg);

    els = document.querySelectorAll('.transaction-receiver-org-input');
    labelText = defaultValues.recipient_org_label;
    helpText = defaultValues.recipient_org_helptext;
    filterOption = 'name';
    API = orgsAPIUrl;
    inputType = 'org';


    updateTypeahead(els, filterOption, labelText, helpText, API, inputType, forceReloadOrg);

    function updateTypeahead(els, filterOption, labelText, helpText, API, inputType, forceReloadOrg) {
        for (var i = 0; i < els.length; i++) {
            var el = els[i];

            // Check if we've already rendered this typeahead
            if (elHasClass(el, 'has-typeahead')) {
                if (forceReloadOrg) {

                    // Remove the existing typeahead, then build a new
                    // one with the reloaded API response
                    var child = el.querySelector('div');
                    el.removeChild(child);
                } else {

                    // Typeahead exists and we don't need to reload the API response.
                    // Do nothing.
                    continue;                    
                }
            }

            var childSelector = el.getAttribute('data-child-id');
            var childClass = el.getAttribute('data-child-class');
            var valueId = null;
            var label = document.createElement('label');
            var help = document.createElement('p');

            label.setAttribute('for', childSelector);
            elAddClass(label, 'control-label');
            elAddClass(label, 'typeahead-label');
            label.textContent = labelText;

            elAddClass(help, 'help-block');
            elAddClass(help, 'hidden');
            help.textContent = helpText;

            if (el.getAttribute('data-value') !== "") {
                valueId = el.getAttribute('data-value');
            }

            var cb = getLoadAsync(childSelector, childClass, valueId, label, help, filterOption, inputType, forceReloadOrg);
            cb();
        }
    }

    function getLoadAsync(childSelector, childClass, valueId, label, help, filterOption, inputType, forceReloadOrg) {
        var output = function() {
            loadAsync(API, 0, MAX_RETRIES, getCallback(childSelector, childClass, valueId, label, help, filterOption, inputType), forceReloadOrg);
        };

        return output;
    }
}

function updateHelpIcons(container) {
    // Add an "info" glyphicon to each label
    // Clicking the glyphicon shows the help text
    var labels = document.querySelectorAll(container + ' label.control-label');

    for (var i = 0; i < labels.length; i++) {
        var label = labels[i];
        var output, helpBlockIsLabelSibling, iconClasses, helpBlockFromLabel;

        if (elHasClass(label, 'has-icon')) {

            // We've already processed this label. Do nothing.
            continue;
        }

        // Assume that the help block is a sibling of the label element
        helpBlockIsLabelSibling = true;
        var numHelpBlocks = label.parentNode.querySelectorAll('.help-block').length;
        var numParentHelpBlocks = label.parentNode.parentNode.querySelectorAll('.help-block').length;

        if (numHelpBlocks === 0) {
            if (numParentHelpBlocks === 1) {
                helpBlockIsLabelSibling = false;
            } else {

            // There is no help block for this label
            continue;
            }
        }

        if (helpBlockIsLabelSibling) {
            helpBlockFromLabel = label.parentNode.querySelector('.help-block');
        } else {
            helpBlockFromLabel = label.parentNode.parentNode.querySelector('.help-block');
        }

        iconClasses = ['glyphicon', 'glyphicon-info-sign', 'info-icon'];

        if (elIsVisible(helpBlockFromLabel)) {
            iconClasses.push('activated');
        }

        output = document.createElement('span');

        iconClasses.forEach(function(el) {
            elAddClass(output, el);
        });

        label.appendChild(output);

        var infoIcons = label.querySelectorAll('.info-icon');

        for (var i = 0; i < infoIcons.length; i++) {
            var el = infoIcons[i];
            var listener = getInfoIconListener(el, helpBlockIsLabelSibling);
            el.onclick = listener;
        }

        // Mark the label as processed to avoid adding extra help icons to it later
        elAddClass(label, 'has-icon');
    }
}

function getInfoIconListener(el, helpBlockIsLabelSibling) {
    var output = function(e) {
        var helpBlock;

        e.preventDefault();

        if (helpBlockIsLabelSibling) {
            helpBlock = el.parentNode.parentNode.querySelector('.help-block');
        } else {
            helpBlock = el.parentNode.parentNode.parentNode.querySelector('.help-block');
        }

        if (elHasClass(el, 'activated')) {

            // Hide the helpblock
            elRemoveClass(el, 'activated');
            helpBlock.style.display = 'none';
        } else {

            // Show the helpblock
            elAddClass(el, 'activated');
            if (elHasClass(helpBlock, 'hidden')) {
                elRemoveClass(helpBlock, 'hidden');
            }
            helpBlock.style.display = 'block';
        }
    };

    return output;
}

function updateAllHelpIcons() {
    var pageContainer;

    pageContainer = '.projectEdit';
    updateHelpIcons(pageContainer);
}

function setSectionCompletionPercentage(section) {
    var inputResults = getInputResults(section);
    var numInputs = inputResults[0];
    var numInputsCompleted = inputResults[1];

    if (numInputs === 0) {
        if (elHasClass(section, 'stepEight')) {
            // Section 8 without mandatory fields (no sectors) should still display empty
            renderCompletionPercentage(0, 1, section);
            return;
        } else {
            // There are no mandatory fields, show the section as complete
            renderCompletionPercentage(1, 1, section);
            return;
        }
    }

    renderCompletionPercentage(numInputsCompleted, numInputs, section);
}

function setPageCompletionPercentage() {
    var inputResults, numInputs, numInputsCompleted, completionPercentage, publishButton;

    inputResults = getInputResults(document.querySelector('.projectEdit'));
    numInputs = inputResults[0];
    numInputsCompleted = inputResults[1];

    completionPercentage = renderCompletionPercentage(numInputsCompleted, numInputs,
                                            document.querySelector('.formOverviewInfo'));

    // Enable publishing when all is filled in
    if (completionPercentage === 100) {
        try {
            publishButton = document.getElementById('publishProject');
            publishButton.removeAttribute('disabled');
            publishButton.className = publishButton.className.replace('btn-danger', 'btn-success');
        } catch (error) {
            // Do nothing, no publish button
        }
    } else {
        try {
            publishButton = document.getElementById('publishProject');
            publishButton.setAttribute('disabled', '');
            publishButton.className = publishButton.className.replace('btn-success', 'btn-danger');
        } catch (error) {
            // Do nothing, no publish button
        }
    }
}

function getInputResults(section) {
    var numInputs = 0;
    var numInputsCompleted = 0;

    for (var i = 0; i < INPUT_ELEMENTS.length; i++) {
        var selector, sectionResults;

        selector = INPUT_ELEMENTS[i] + MEASURE_CLASS;
        sectionResults = section.querySelectorAll(selector);

        for (var j = 0; j < sectionResults.length; j++ ) {
            var result = sectionResults[j];

            if (result.getAttribute('name') === 'step') {
                // This is a progress bar input, ignore it
                continue;
            }

            if (result.getAttribute('disabled') !== null) {
                // This is a disabled input, ignore it
                continue;
            }

            numInputs += 1;

            if (result.getAttribute('name') === 'projectStatus' && result.value === 'N') {
                // Ignore project status 'None'
                continue;
            } else if (result.value !== '') {
                numInputsCompleted += 1;
            } else if (result.getAttribute('name') === 'photo' && result.getAttribute('default') !== '' && result.getAttribute('default') !== null) {
                // Custom code for project photo
                numInputsCompleted += 1;
            }
        }
    }
    return [numInputs, numInputsCompleted];
}

function renderCompletionPercentage(numInputsCompleted, numInputs, section) {
    var completionPercentage, completionClass, publishButton;

    completionPercentage = Math.floor((numInputsCompleted / numInputs) * 100);
    if (completionPercentage === 0) {
        // Never show an empty bar
        completionPercentage = 1;
    }

    section.querySelector('.progress-bar').setAttribute('aria-valuenow', completionPercentage);
    section.querySelector('.progress .sr-only').textContent = completionPercentage + '% Complete';
    section.querySelector('div.progress-bar').style.width = completionPercentage + '%';

    if (completionPercentage < 10) {
        completionClass = 'empty';
    } else if (completionPercentage < 100) {
        completionClass = 'incomplete';
    } else if (completionPercentage === 100) {
        completionClass = 'complete';
    }

    section.querySelector('div.progress-bar').setAttribute('data-completion', completionClass);

    return completionPercentage;
}

function setSectionChangeListener(section) {
    for (var i = 0; i < INPUT_ELEMENTS.length; i++) {
        var selector;
        var elements;

        selector = INPUT_ELEMENTS[i] + MEASURE_CLASS;
        elements = section.querySelectorAll(selector);

        for (var y = 0; y < elements.length; y++) {
            var listener;
            var el = elements[y];

            if (elHasClass(el, 'has-listener')) {

                // We have already added a class for this listener
                // do nothing
                continue;
            }

            listener = getChangeListener(section, this);
            el.addEventListener('change', listener);
        }
    }
}

function getChangeListener(section, el) {
    var listener;

    listener = function() {
        var currentSection;
        currentSection = section;

        setSectionCompletionPercentage(currentSection);
        elAddClass(el, 'has-listener');
        setPageCompletionPercentage();
    };
    return listener;
}

function setAllSectionsCompletionPercentage() {
    var formSteps = document.querySelectorAll('.formStep');

    for (var i = 0; i < formSteps.length; i++) {
        setSectionCompletionPercentage(formSteps[i]);
    }
}

function setAllSectionsChangeListerner() {
    var formSteps = document.querySelectorAll('.formStep');

    for (var i = 0; i < formSteps.length; i++) {
        setSectionChangeListener(formSteps[i]);
    }
}

// Validate all inputs with the given class
// Display validation status to the user in real time
function setValidationListeners() {
    var inputs = document.querySelectorAll('input');
    var textareas = document.querySelectorAll('textarea');

    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var inputListener;
        var focusOutListener;

        if (elHasClass(input, 'validation-listener')) {

            // We've already set the listener for this element, do nothing
            continue;
        }

        // Max character counts for text inputs
        if (input.getAttribute('type') === 'text' && input.hasAttribute('maxlength')) {
            inputListener = getLengthListener(input);
            focusOutListener = getHideCharsListener(input);
            input.addEventListener('input', inputListener);
            input.addEventListener('focusout', focusOutListener);
        }

    }

    for (var i = 0; i < textareas.length; i++) {
        var textarea = textareas[i];
        var inputListener;
        var focusOutListener;

        if (elHasClass(textarea, 'validation-listener')) {

            // We've already set the listener for this element, do nothing
            continue;
        }

        // Max character counts for textareas
        if (textarea.hasAttribute('maxlength')) {
            inputListener = getLengthListener(textarea);
            focusOutListener = getHideCharsListener(textarea);
            textarea.addEventListener('input', inputListener);
            textarea.addEventListener('focusout', focusOutListener);
        }
    }

    function getLengthListener(el) {
            var output = function() {
            var maxLength, currentLength, charsLeft, charMessage;

            maxLength = parseInt(el.getAttribute('maxlength'), 10);
            currentLength = el.value.length;
            charsLeft = maxLength - currentLength;
            charMessage = '';

            if (el.parentNode.querySelectorAll('.charsLeft').length === 0) {
                var child = document.createElement('span');
                elAddClass(child, 'charsLeft');
                el.parentNode.appendChild(child);
            }

            if (charsLeft === 1) {
                charMessage = ' character remaining';
            } else {
                charMessage = ' characters remaining';
            }

            el.parentNode.querySelector('.charsLeft').style.display = '';
            el.parentNode.querySelector('.charsLeft').textContent = charsLeft + charMessage;
        };

        return output;
    }

    function getHideCharsListener(el) {
        var parent = el.parentNode;
        var output;
        var outputTimeout;

        output = function() {
            var charsLeft = parent.querySelector('.charsLeft');
            if (charsLeft) {
                charsLeft.style.display = 'none';
            }
        };

        outputTimeout = function() {
            setTimeout(output, 250);
        };

        return outputTimeout;
    }

    // Mark mandatory fields with an asterisk
    function markMandatoryFields() {
        var existingMarkers = document.querySelectorAll('.mandatory');
        var elementsToMark = document.querySelectorAll('.priority1 ~ label');

        // Clear any existing markers
        for (var i = 0; i < existingMarkers.length; i++) {
            var el = existingMarkers[i];

            el.parentNode.removeChild(el);
        }

        for (var i = 0; i < elementsToMark.length; i++) {
            var el = elementsToMark[i];
            var markContainer = document.createElement('span');

            elAddClass(markContainer, 'mandatory');
            markContainer.textContent = '*';

            el.appendChild(markContainer);
        }
    }

    markMandatoryFields();
}

function setCurrencyOnChange() {
    try {
        var currencyDropdown;

        currencyDropdown = document.getElementById('projectCurrency');
        currencyDropdown.onchange = updateCurrency(currencyDropdown);
    } catch (error) {
        // No currency dropdown
        return false;
    }
}

function updateCurrency(currencyDropdown) {
    return function(e) {
        e.preventDefault();

        var currencyDisplays, currency;

        currency = currencyDropdown.options[currencyDropdown.selectedIndex].text;
        currencyDisplays = document.getElementsByClassName('currency-display');

        for (var i=0; i < currencyDisplays.length; i++) {
            currencyDisplays[i].innerHTML = currency;
        }
    };
}

function setToggleSectionOnClick () {
    var toggleSections;

    toggleSections = document.getElementsByClassName('toggleSection');

    for (var i=0; i < toggleSections.length; i++) {
        toggleSections[i].onclick = toggleSection(toggleSections[i]);
    }
}

function toggleSection(node) {
    return function(e) {
        e.preventDefault();

        var allFormBlocks, allSections, div, formBlock, infoIcon, inputStep;

        div = node.parentNode.parentNode;
        allFormBlocks = document.getElementsByClassName('formBlock');
        allSections = document.getElementsByClassName('toggleSection');
        formBlock = div.getElementsByClassName('formBlock')[0];
        inputStep = div.getElementsByTagName('input')[0];
        infoIcon = node.getElementsByClassName('info-icon')[0];

        if (formBlock.className.indexOf('hidden') > -1) {
            formBlock.className = formBlock.className.replace('hidden', '');
            inputStep.checked = true;
            setTimeout(function () {
                div.scrollIntoView();
                window.scrollBy(0, -100);
            }, 1);
            for (var i=0; i < allFormBlocks.length; i++) {
                if (allFormBlocks[i] !== formBlock && allFormBlocks[i].className.indexOf('hidden') === -1) {
                    allFormBlocks[i].className += ' hidden';
                }
            }
            for (var j=0; j < allSections.length; j++) {
                var sectionInfoIcon = allSections[j].getElementsByClassName('info-icon')[0];
                if (sectionInfoIcon.className.indexOf('hidden') === -1) {
                    sectionInfoIcon.className += ' hidden';
                }
            }
            if (infoIcon.className.indexOf('hidden') > -1) {
                infoIcon.className = infoIcon.className.replace('hidden', '');
            }
        } else {
            formBlock.className += ' hidden';
            infoIcon.className += ' hidden';
        }
    };
}

function setRemovePartial(node) {
    return function(e) {
        e.preventDefault();

        removePartial(node);
    };
}

function setImportResults() {
    try {
        var importButton;

        importButton = document.getElementById('import-results');
        importButton.onclick = getImportResults(importButton);

    } catch (error) {
        // No import results button
        return false;
    }
}

function getImportResults(importButton) {
    return function(e) {
        var api_url, parentNode, request;

        e.preventDefault();

        importButton.setAttribute('disabled', '');
        parentNode = importButton.parentNode;

        // Create request
        api_url = '/rest/v1/project/' + defaultValues.project_id + '/import_results/?format=json';

        request = new XMLHttpRequest();
        request.open('POST', api_url, true);
        request.setRequestHeader("X-CSRFToken", csrftoken);
        request.setRequestHeader("Content-type", "application/json");

        request.onload = function() {
            var response, divNode;
            response = JSON.parse(request.responseText);
            divNode = document.createElement('div');

            if (response.code === 1) {
                parentNode.removeChild(importButton);

                divNode.classList.add('save-success');
                divNode.innerHTML = 'Import successful. Please refresh the page to see (and edit) the imported results.';
                parentNode.appendChild(divNode);
            } else {
                importButton.removeAttribute('disabled');

                divNode.classList.add('help-block-error');
                divNode.innerHTML = response.message;
                parentNode.appendChild(divNode);
            }
        };

        request.send();
    }
}

function setPublishOnClick() {
    try {
        var publishButton;

        publishButton = document.getElementById('publishProject');
        publishButton.onclick = getProjectPublish(defaultValues.publishing_status_id, publishButton);

    } catch (error) {
        // No publish button
        return false;
    }
}

function getProjectPublish(publishingStatusId, publishButton) {
    return function(e) {
        e.preventDefault();

        publishButton.setAttribute('disabled', '');

        var api_url, request, publishErrorNode, span, unsavedMessage, unsavedSections;

        // Remove any previous errors
        publishErrorNode = document.getElementById('publishErrors');
        publishErrorNode.innerHTML = '';

        // Check for unsaved changes first
        unsavedSections = checkUnsavedChanges();
        if (unsavedSections.length > 0) {
            unsavedMessage = "You can't publish, because there are unsaved changes in the following section(s):<ul>";

            for (var i = 0; i < unsavedSections.length; i++) {
                unsavedMessage += "<li>" + unsavedSections[i] + "</li>";
            }

            unsavedMessage += "</ul>";

            span = document.createElement("span");
            span.className = 'notPublished';
            span.innerHTML = unsavedMessage;
            publishErrorNode.appendChild(span);

            publishButton.removeAttribute('disabled');

            // Don't publish
            return;
        }

        // Create request
        api_url = '/rest/v1/publishing_status/' + publishingStatusId + '/?format=json';

        request = new XMLHttpRequest();
        request.open('PATCH', api_url, true);
        request.setRequestHeader("X-CSRFToken", csrftoken);
        request.setRequestHeader("Content-type", "application/json");

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                // Succesfully published project!
                var publishingStatusNode, viewProjectButton;

                publishButton.parentNode.removeChild(publishButton);

                publishingStatusNode = document.getElementById('publishingStatus');
                publishingStatusNode.className = "published";
                publishingStatusNode.innerHTML = "published";

                viewProjectButton = document.getElementById('viewProject');
                viewProjectButton.innerHTML = defaultValues.view_project;

                return false;
            } else {
                // We reached our target server, but it returned an error
                publishButton.removeAttribute('disabled');

                if (request.status == 400) {
                    // Could not publish due to checks
                    var response;

                    response = JSON.parse(request.responseText);

                    span = document.createElement("span");
                    span.className = 'notPublished';
                    publishErrorNode.appendChild(span);

                    try {
                        for (var i=0; i < response.__all__.length; i++) {
                            span.innerHTML += response.__all__[i] + '<br/>';
                        }
                    } catch (error) {
                        // General error message
                        publishErrorNode.innerHTML = 'Could not publish project';
                    }
                }

                return false;
            }
        };

        request.onerror = function() {
            // There was a connection error of some sort
            publishButton.removeAttribute('disabled');
            return false;
        };

        request.send('{"status": "published"}');

    };
}

function setDatepickers() {
    var datepickerContainers;

    datepickerContainers = document.getElementsByClassName('datepicker-container');

    for (var i=0; i < datepickerContainers.length; i++) {
        var datepickerId, DatePickerComponent, datepickerContainer, disableInput, extraAttributes, helptext, initialDate, inputNode, inputValue, label;

        datepickerContainer = datepickerContainers[i];

        // Check if datepicker already has been set
        if (datepickerContainer.className.indexOf('has-datepicker') == -1) {
            datepickerId = datepickerContainer.getAttribute('data-id');

            // Set initial value of datepicker
            inputValue = datepickerContainer.getAttribute('data-child');
            disableInput = datepickerContainer.getAttribute('data-disabled');

            if (inputValue !== "") {
                initialDate = moment(inputValue, "DD-MM-YYYY");
            } else {
                initialDate = null;
            }

            DatePickerComponent = React.createClass({
                displayName: datepickerId,

                getInitialState: function () {
                    return {
                        initialDate: initialDate,
                        disableInput: disableInput
                    };
                },

                handleDateChange: function (date) {
                    this.setState({
                        initialDate: date
                    });
                },

                render: function () {
                    if (disableInput !== 'true') {
                        return React.DOM.div(null, 
                            DatePicker(
                            {locale:  "en",
                            placeholderText:  "",
                            dateFormat:  "DD/MM/YYYY",
                            selected:  this.state.initialDate,
                            onChange:  this.handleDateChange}
                            )
                        );
                    } else {
                        return React.DOM.div(null, 
                            DatePicker(
                            {locale:  "en",
                            placeholderText:  "",
                            dateFormat:  "DD/MM/YYYY",
                            selected:  this.state.initialDate}
                            )
                        );
                    }
                }
            });


            React.render(DatePickerComponent( {key:datepickerId} ), datepickerContainer);

            // Set id, name and saved value of datepicker input
            inputNode = datepickerContainer.getElementsByClassName('datepicker__input')[0];
            inputNode.setAttribute("id", datepickerId);
            inputNode.setAttribute("name", datepickerId);
            inputNode.setAttribute("saved-value", inputValue);
            if (disableInput === 'true') {
                inputNode.setAttribute("disabled", '');
            }

            // Set classes of datepicker input
            inputNode.className += ' form-control ' + datepickerContainer.getAttribute('data-classes');

            // Set addtional attributes of input
            extraAttributes = datepickerContainer.getAttribute('data-attributes');
            if (extraAttributes !== null) {
                var extraAttributesList = extraAttributes.split(' ');
                for (var j = 0; j < extraAttributesList.length; j++) {
                    if (extraAttributesList[j] !== '') {
                        inputNode.setAttribute(extraAttributesList[j], '');
                    }
                }
            }

            // Set label of datepicker
            label = document.createElement('label');
            label.setAttribute("for", datepickerId);
            label.setAttribute("class", "control-label");
            label.innerHTML = datepickerContainer.getAttribute('data-label');
            inputNode.parentNode.appendChild(label);

            // Set helptext of datepicker
            helptext = document.createElement('p');
            helptext.setAttribute("class", "help-block hidden");
            helptext.innerHTML = datepickerContainer.getAttribute('data-helptext');
            inputNode.parentNode.appendChild(helptext);

            datepickerContainer.className += ' has-datepicker';
        }
    }
}

function checkUnsavedChangesForm(form) {
    var inputs, selects, textareas;

    inputs = form.getElementsByTagName('input');
    selects = form.getElementsByTagName('select');
    textareas = form.getElementsByTagName('textarea');

    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type == 'file') {
            // Ignore file inputs for now.
        } else if (inputs[i].type == 'checkbox') {
            if (inputs[i].checked && (inputs[i].getAttribute('saved-value') == 'False')) {
                return true;
            } else if (!inputs[i].checked && (inputs[i].getAttribute('saved-value') == 'True')) {
                return true;
            }
        } else if (inputs[i].parentNode.className.indexOf('typeahead') > -1) {
            if (inputs[i].getAttribute('value') != inputs[i].getAttribute('saved-value')) {
                return true;
            }
        } else if (inputs[i].value != inputs[i].getAttribute('saved-value')) {
            return true;
        }
    }

    for (var j=0; j < selects.length; j++) {
        if (selects[j].value != selects[j].getAttribute('saved-value')) {
            return true;
        }
    }

    for (var k = 0; k < textareas.length; k++) {
        if (textareas[k].value != textareas[k].getAttribute('saved-value')) {
            return true;
        }
    }

    return false;
}

function checkUnsavedChanges() {
    var forms, unsavedForms;

    unsavedForms = [];
    forms = [
        ['1', '01 - General information'],
        ['2', '02 - Contact information'],
        ['3', '03 - Project partners'],
        ['4', '04 - Project descriptions'],
        ['5', '05 - Results and indicators'],
        ['6', '06 - Finance'],
        ['7', '07 - Project locations'],
        ['8', '08 - Project focus'],
        ['9', '09 - Links and documents'],
        ['10', '10 - Project comments']
    ];

    for (var i=0; i < forms.length; i++) {
        if (checkUnsavedChangesForm(document.getElementById('admin-step-' + forms[i][0]))) {
            unsavedForms.push(forms[i][1]);
        }
    }

    return unsavedForms;
}

function setUnsavedChangesMessage() {
    window.onbeforeunload = function(e) {
        var unsavedSections, message;

        e = e || window.event;

        unsavedSections = checkUnsavedChanges();
        if (unsavedSections.length > 0) {
            message = "You have unsaved changes in the following section(s):\n\n";
            for (var i = 0; i < unsavedSections.length; i++) {
                message += "\t• " + unsavedSections[i] + "\n";
            }

            // For IE and Firefox
            if (e) {
                e.returnValue = message;
            }
            // For Safari and Chrome
            return message;
        }
    };
}

/* Show the "add organisation" modal dialog */
function addOrgModal() {

    /* Remove the modal */
    function cancelModal() {
        var modal = document.querySelector('.modalParent');
        modal.parentNode.removeChild(modal);
    }

    /* Submit the new org */
    function submitModal() {
        if (allInputsFilled() && checkLocationFilled()) {
            var api_url, request, form, form_data;

            // Add organisation to DB
            form = document.querySelector('#addOrganisation');
            form_data = serialize(form);

            // Remove empty IATI organistion id
            form_data = form_data.replace('iati_org_id=&', '');

            api_url = '/rest/v1/organisation/?format=json';

            request = new XMLHttpRequest();
            request.open('POST', api_url, true);
            request.setRequestHeader("X-CSRFToken", csrftoken);
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

            request.onload = function() {
                if (request.status === 201) {
                    var organisation_id;

                    // Get organisation ID
                    response = JSON.parse(request.responseText);
                    organisation_id = response.id;

                    // Add location (fails silently)
                    if (form.querySelector('#latitude').value !== '') {
                        var request_loc;
                        api_url = '/rest/v1/organisation_location/?format=json';
                        request_loc = new XMLHttpRequest();
                        request_loc.open('POST', api_url, true);
                        request_loc.setRequestHeader("X-CSRFToken", csrftoken);
                        request_loc.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                        request_loc.send(form_data + '&location_target=' + organisation_id);
                    }

                    // Add logo (fails silently)
                    var logo_request, logo_data, org_logo_files;
                    org_logo_files = document.getElementById("org-logo").files;
                    if (org_logo_files !== undefined) {
                        api_url = '/rest/v1/organisation/' + organisation_id + '/add_logo/?format=json';
                        logo_data = new FormData();
                        logo_data.append("logo", org_logo_files[0]);
                        logo_request = new XMLHttpRequest();
                        logo_request.open("POST", api_url);
                        logo_request.setRequestHeader("X-CSRFToken", csrftoken);
                        logo_request.send(logo_data);
                    }

                    // This flag forces the fetching of a fresh API response
                    var forceReloadOrg = true;

                    updateTypeaheads(forceReloadOrg);
                    cancelModal();
                } else if (request.status === 400) {
                    var response;
                    response = JSON.parse(request.responseText);

                    document.querySelector('.orgModal').scrollTop = 0;

                    for (var key in response) {
                        if (response.hasOwnProperty(key)) {
                            var input = form.querySelector('#' + key);
                            var inputParent = input.parentNode;
                            var inputHelp = inputParent.querySelector('.help-block');
                            inputHelp.textContent = response[key];
                            elAddClass(inputHelp, 'help-block-error');
                            elAddClass(inputParent, 'has-error');
                        }
                    }
                    return false;
                } else {
                    elAddClass(form, 'has-error');
                    return false;
                }
            };

            request.onerror = function() {
                // There was a connection error of some sort
                document.querySelector('#addOrgGeneralError').textContent = defaultValues.general_error;
                document.querySelector('.orgModal').scrollTop = 0;
                return false;
            };

            request.send(form_data);
        } else {
            document.querySelector('.orgModal').scrollTop = 0;
        }
    }

    function allInputsFilled() {
        var allInputsFilledBoolean = true;
        var shortName = document.querySelector('#name');
        var shortNameHelp = document.querySelector('#name + label + .help-block');
        var shortNameContainer = document.querySelector('.inputContainer.newOrgName');
        var longName = document.querySelector('#long_name');
        var longNameHelp = document.querySelector('#long_name + label + .help-block');
        var longNameContainer = document.querySelector('.inputContainer.newOrgLongName');

        if (shortName.value === '') {
            shortNameHelp.textContent = defaultValues.blank_name;
            elAddClass(shortNameHelp, 'help-block-error');
            elAddClass(shortNameContainer, 'has-error');
            allInputsFilledBoolean = false;
        } else {
            shortNameHelp.textContent = '';
            elRemoveClass(shortNameHelp, 'help-block-error');
            elRemoveClass(shortNameContainer, 'has-error');
        }

        if (longName.value === '') {
            longNameHelp.textContent = defaultValues.blank_long_name;
            elAddClass(longNameHelp, 'help-block-error');
            elAddClass(longNameContainer, 'has-error');
            allInputsFilledBoolean = false;
        } else {
            longNameHelp.textContent = '';
            elRemoveClass(longNameHelp, 'help-block-error');
            elRemoveClass(longNameContainer, 'has-error');
        }

        return allInputsFilledBoolean;
    }

    function checkLocationFilled() {
        var latitudeNode, longitudeNode, countryNode, latitudeHelp, longitudeHelp, countryHelp, result;

        latitudeNode = document.querySelector('#latitude');
        latitudeHelp = document.querySelector('#latitude + label + .help-block');
        longitudeNode = document.querySelector('#longitude');
        longitudeHelp = document.querySelector('#longitude + label + .help-block');
        countryNode = document.querySelector('#country');
        countryHelp = document.querySelector('#country + label + .help-block');

        result = true;

        if (latitudeNode.value === '' && longitudeNode.value === '' && countryNode.value === '') {
            return result;
        } else if (latitudeNode.value === '' || longitudeNode.value === '' || countryNode.value === '') {
            if (latitudeNode.value === '') {
                latitudeHelp.textContent = defaultValues.location_check;
                elAddClass(latitudeHelp, 'help-block-error');
                elAddClass(latitudeHelp.parentNode, 'has-error');
            }
            if (longitudeNode.value === '') {
                longitudeHelp.textContent = defaultValues.location_check;
                elAddClass(longitudeHelp, 'help-block-error');
                elAddClass(longitudeHelp.parentNode, 'has-error');
            }
            if (countryNode.value === '') {
                countryHelp.textContent = defaultValues.location_check;
                elAddClass(countryHelp, 'help-block-error');
                elAddClass(countryHelp.parentNode, 'has-error');
            }
            result = false;
        } else {
            if (latitudeNode.value.indexOf(',') > 0) {
                latitudeHelp.textContent = defaultValues.comma_value;
                elAddClass(latitudeHelp, 'help-block-error');
                elAddClass(latitudeHelp.parentNode, 'has-error');
                result = false;
            }
            if (longitudeNode.value.indexOf(',') > 0) {
                longitudeHelp.textContent = defaultValues.comma_value;
                elAddClass(longitudeHelp, 'help-block-error');
                elAddClass(longitudeHelp.parentNode, 'has-error');
                result = false;
            }
        }
        return result;
    }

    Modal = React.createClass({displayName: 'Modal',
        render: function() {
            var country_option_list = countryValues.map(function(country) {
              return (
                  React.DOM.option( {value:country.pk}, country.name)
              );
            });

            return (
                    React.DOM.div( {className:"modalParent"}, 
                        React.DOM.div( {className:"modalBackground"}
                        ),
                        React.DOM.div( {className:"modalContainer"}, 
                            React.DOM.div( {className:"orgModal"}, 
                                React.DOM.div( {className:"modalContents projectEdit"}, 
                                    React.DOM.h4(null, defaultValues.add_new_organisation),
                                    React.DOM.form( {id:"addOrganisation"}, 
                                        React.DOM.div( {className:"row"}, 
                                            React.DOM.div( {id:"addOrgGeneralError", className:"col-md-12 help-block-error"})
                                        ),
                                        React.DOM.div( {className:"row"}, 
                                            React.DOM.div( {className:"inputContainer newOrgName col-md-4"}, 
                                                React.DOM.input( {name:"name", id:"name", type:"text", className:"form-control", maxLength:"25"}),
                                                React.DOM.label( {htmlFor:"newOrgName", className:"control-label"}, defaultValues.name,React.DOM.span( {className:"mandatory"}, "*")),
                                                React.DOM.p( {className:"help-block"}, defaultValues.max, " 25 ", defaultValues.characters)
                                            ),
                                            React.DOM.div( {className:"inputContainer newOrgLongName col-md-4"}, 
                                                React.DOM.input( {name:"long_name", id:"long_name", type:"text",  className:"form-control", maxLength:"75"}),
                                                React.DOM.label( {htmlFor:"newOrgLongName", className:"control-label"}, defaultValues.long_name,React.DOM.span( {className:"mandatory"}, "*")),
                                                React.DOM.p( {className:"help-block"}, defaultValues.max, " 75 ", defaultValues.characters)
                                            ),
                                            React.DOM.div( {className:"inputContainer newOrgIatiId col-md-4"}, 
                                                React.DOM.input( {name:"iati_org_id", id:"iati_org_id", type:"text",  className:"form-control", maxLength:"75"}),
                                                React.DOM.label( {htmlFor:"newOrgIatiId", className:"control-label"}, defaultValues.iati_org_id),
                                                React.DOM.p( {className:"help-block"}, defaultValues.max, " 75 ", defaultValues.characters)
                                            )
                                        ),
                                        React.DOM.div( {className:"row"}, 
                                            React.DOM.div( {className:"inputContainer col-md-12"}, 
                                                React.DOM.input( {type:"file", className:"form-control", id:"org-logo", name:"org-logo", accept:"image/*"}),
                                                React.DOM.label( {className:"control-label", for:"org-logo"}, defaultValues.org_logo)
                                            )
                                        ),
                                        React.DOM.div( {className:"row"}, 
                                            React.DOM.div( {className:"IATIOrgTypeContainer inputContainer col-md-6"}, 
                                                React.DOM.select( {name:"new_organisation_type", id:"newOrgIATIType",  className:"form-control"}, 
                                                    React.DOM.option( {value:"10"}, "10 - ", defaultValues.government),
                                                    React.DOM.option( {value:"15"}, "15 - ", defaultValues.other_public_sector),
                                                    React.DOM.option( {value:"21"}, "21 - ", defaultValues.international_ngo),
                                                    React.DOM.option( {value:"22"}, "22 - ", defaultValues.national_ngo),
                                                    React.DOM.option( {value:"23"}, "23 - ", defaultValues.regional_ngo),
                                                    React.DOM.option( {value:"30"}, "30 - ", defaultValues.public_private_partnership),
                                                    React.DOM.option( {value:"40"}, "40 - ", defaultValues.multilateral),
                                                    React.DOM.option( {value:"60"}, "60 - ", defaultValues.foundation),
                                                    React.DOM.option( {value:"70"}, "70 - ", defaultValues.private_sector),
                                                    React.DOM.option( {value:"80"}, "80 - ", defaultValues.academic_training_research)
                                                ),
                                                React.DOM.label( {htmlFor:"newOrgIATIType", className:"control-label"}, defaultValues.org_type,React.DOM.span( {className:"mandatory"}, "*")),
                                                React.DOM.p( {className:"help-block"})
                                            ),
                                            React.DOM.div( {className:"inputContainer col-md-6"}, 
                                                React.DOM.input( {name:"url", id:"url", type:"text", className:"form-control"}),
                                                React.DOM.label( {htmlFor:"url", className:"control-label"}, defaultValues.website),
                                                React.DOM.p( {className:"help-block"}, defaultValues.start_http)
                                            )
                                        ),
                                        React.DOM.div( {className:"row"}, 
                                            React.DOM.div( {className:"inputContainer col-md-4"}, 
                                                React.DOM.input( {name:"latitude", id:"latitude", type:"text", className:"form-control"}),
                                                React.DOM.label( {htmlFor:"latitude", className:"control-label"}, defaultValues.latitude),
                                                React.DOM.p( {className:"help-block"})
                                            ),
                                            React.DOM.div( {className:"inputContainer col-md-4"}, 
                                                React.DOM.input( {name:"longitude", id:"longitude", type:"text",  className:"form-control"}),
                                                React.DOM.label( {htmlFor:"longitude", className:"control-label"}, defaultValues.longitude),
                                                React.DOM.p( {className:"help-block"})
                                            ),
                                            React.DOM.div( {className:"inputContainer col-md-4"}, 
                                                React.DOM.select( {name:"country", id:"country", className:"form-control"}, 
                                                    React.DOM.option( {value:""}, defaultValues.country,":"),
                                                    country_option_list
                                                ),
                                                React.DOM.label( {htmlFor:"country", className:"control-label"}, defaultValues.country),
                                                React.DOM.p( {className:"help-block"})
                                            )
                                        ),
                                        React.DOM.div( {className:"row"}, 
                                            React.DOM.p( {className:"help-block"}, defaultValues.use_link, " ", React.DOM.a( {href:"http://mygeoposition.com/", target:"_blank"}, "http://mygeoposition.com/"), " ", defaultValues.coordinates)
                                        ),
                                        React.DOM.div( {className:"row"}, 
                                            React.DOM.div( {className:"inputContainer col-md-6"}, 
                                                React.DOM.input( {name:"contact_person", id:"contact_person", type:"text", className:"form-control"}),
                                                React.DOM.label( {htmlFor:"contact_person", className:"control-label"}, defaultValues.contact_person),
                                                React.DOM.p( {className:"help-block"})
                                            ),
                                            React.DOM.div( {className:"inputContainer col-md-6"}, 
                                                React.DOM.input( {name:"contact_email", id:"contact_email", type:"text", className:"form-control"}),
                                                React.DOM.label( {htmlFor:"contact_email", className:"control-label"}, defaultValues.contact_email),
                                                React.DOM.p( {className:"help-block"})
                                            )
                                        ),
                                        React.DOM.div( {className:"row"}, 
                                            React.DOM.div( {className:"inputContainer col-md-12"}, 
                                                React.DOM.textarea( {id:"description", className:"form-control", name:"description", rows:"3"}),
                                                React.DOM.label( {className:"control-label", htmlFor:"description"}, defaultValues.description),
                                                React.DOM.p( {className:"help-block"})
                                            )
                                        )
                                    ),
                                    React.DOM.div( {className:"controls"}, 
                                        React.DOM.button( {className:"modal-cancel btn btn-danger", onClick:cancelModal}, 
                                        React.DOM.span( {className:"glyphicon glyphicon-trash"}), " ", defaultValues.cancel
                                        ),
                                        React.DOM.button( {className:"modal-save btn btn-success", onClick:submitModal}, 
                                            React.DOM.span( {className:"glyphicon glyphicon-plus"}), " ", defaultValues.add_new_organisation
                                        )
                                    )   
                                )
                            )                   
                        )
                    )
            );
        }
    });

    React.render(
        Modal(null ),

        // Use the footer to prevent page scroll on injection
        document.querySelector('footer')
    );    
}

/* General Helper Functions */

function elHasClass(el, className) {
    if (el.classList && el.classList.forEach) {
        var result = false;
        el.classList.forEach( function(entry) {
            if (entry.toString() === className.toString()) {
                result = true;
                return;
            }
        });
        return result;
    } else {
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }
}

function elAddClass(el, className) {
    if (el.classList) {
        el.classList.add(className);
    } else {
      el.className += ' ' + className;
    }
}

function elRemoveClass(el, className) {
    if (el.classList) {
        el.classList.remove(className);
    }
    else {
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
}

function elIsVisible(el) {
    return el.offsetWidth > 0 && el.offsetHeight > 0;
}

document.addEventListener('DOMContentLoaded', function() {
    setUnsavedChangesMessage();
    setDatepickers();
    setToggleSectionOnClick();
    setPublishOnClick();
    setSubmitOnClicks();
    setPartialOnClicks();
    setCurrencyOnChange();
    setDeletePhoto();
    setImportResults();

    setValidationListeners();
    updateAllHelpIcons();

    updateTypeaheads();

    try {
        localStorageResponses = JSON.parse(localStorageResponses);
    } catch (error) {
        localStorageResponses = {};
    }

    // Keep count of how many of each partial we've injected
    for (var i=0; i < partials.length; i++) {
        var partialName = partials[i];

        partialsCount[partialName] = 1;
    }

    setAllSectionsCompletionPercentage();
    setAllSectionsChangeListerner();
    setPageCompletionPercentage();
});
