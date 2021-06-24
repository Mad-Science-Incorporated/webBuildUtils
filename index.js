let fs = require('fs-extra')

module.exports = {
    /**
     * Concatenates all files found by "find" glob
     * find : glob string
     * output : path for output file
     */
    async bundle(find, output, globOptions = {}){
        return new Promise((resolve, reject)=>{
            try {
                const glob = require('glob'),
                    MultiStream = require('multistream')

                glob(find, globOptions, (err, files) => {
                    if (err)
                        return reject(err)

                    let outStream = fs.createWriteStream(output),
                        streams = []

                    for (const file of files)
                        streams.push(fs.createReadStream(file))

                    new MultiStream(streams).pipe(outStream)
                    resolve(files)
                })
            } catch (ex){
                reject(ex)
            }
        })
    },
    
    async minifyJS(input, output, options = {}){
        // set default options
        options.mangle = options.mangle || {}
        if (options.mangle.keepClassName === undefined)
            options.mangle.keepClassName = true

        const bminify = require('babel-minify'),
            { code, map } = bminify(await fs.readFile(input, 'utf8'), options, { sourceMaps : true })

        await fs.writeFile(output, code)
        await fs.writeJSON(`${output}.map`, map)
    },
    
    
    async minifyCSS(input, output){
        const minify = require('@node-minify/core'),
            cleanCSS = require('@node-minify/clean-css')

        minify({ compressor: cleanCSS, input, output })
    },

    /**
     * Writes a text banner to the top of the given fil
     * file : string, file path
     * banner : string, banner to write to top of file
     */
    async bannerize(file, banner){
        return new Promise((resolve, reject)=>{
            try {
                const MultiStream = require('multistream'),
                    { Readable } = require('stream'),
                    fs = require('fs-extra'),
                    path = require('path'),
                    tempFile = path.join(path.dirname(file), `${new Date().getTime()}.${path.basename(file)}.bannerize`)
    
            new MultiStream([Readable.from([banner]), fs.createReadStream(file)])
                .pipe(fs.createWriteStream(tempFile)
                .on('close', async ()=>{
                    await fs.remove(file)
                    await fs.move(tempFile, file)
                    resolve()
                }))
    
            } catch (ex){
                reject(ex)
            }
        })
    }
}
