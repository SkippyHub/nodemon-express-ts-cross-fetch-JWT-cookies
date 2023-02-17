// fetch the submit from the form
// var submitUrl = document.getElementById('submitUrl').value;

// function to handle the submit form
// function handleSubmit(e) {
//     // prevent the default action of the form
//     e.preventDefault();
//     console.log(e)
//     // get the value of the input field
//     var submitUrl = document.getElementById('submitUrl').value;
//     // check if the input field is empty
//     fetch("submit", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             url: submitUrl
//         })
//     })
//         .then(res => res.json())
//         .then(data => {
//             // check if the data is empty
//             if (data.length === 0) {
//                 // if empty, display the error message
//                 document.getElementById('error').style.display = "block";
//             } else {
//                 // if not empty, display the success message
//                 document.getElementById('success').style.display = "block";
//                 // display the data in the table
//                 displayData(data);
//             }
//         })
//         .catch(err => console.log(err));
// }