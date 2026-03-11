const fs = require('fs');
const https = require('https');

https.get('https://turkiyeapi.dev/api/v1/provinces?fields=name,districts', (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsedData = JSON.parse(data);
            const cities = [];
            const districtsData = {};

            parsedData.data.forEach(province => {
                cities.push(province.name);
                districtsData[province.name] = province.districts.map(d => d.name).sort((a,b) => a.localeCompare(b, 'tr'));
            });

            // Sort cities alphabetically (Turkish)
            cities.sort((a, b) => a.localeCompare(b, 'tr'));

            const finalOutput = {
                cities,
                districtsData
            };

            const targetDir = 'src/data';
            if (!fs.existsSync(targetDir)){
                fs.mkdirSync(targetDir, { recursive: true });
            }

            fs.writeFileSync(`${targetDir}/cities.json`, JSON.stringify(finalOutput, null, 2), 'utf-8');
            console.log('Successfully generated src/data/cities.json!');
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
