const fs = require("fs").promises;
const dedent = require("dedent");
const camelcase = require("camelcase");
const { promisify } = require("util");
const rimraf = promisify(require("rimraf"));
const svgr = require("@svgr/core").default;

console.log(svgr);
function defaultTemplate(
  { template },
  opts,
  { imports, interfaces, componentName, props, jsx, exports }
) {
  const plugins = ["jsx"];
  if (opts.typescript) {
    plugins.push("typescript");
  }
  const typeScriptTpl = template.smart({ plugins });
  return typeScriptTpl.ast`${jsx}`;
}

function svgToRescript(svg, componentName) {
  return svgr(svg, { template: defaultTemplate }, { componentName });
}

function replace_(x) {
  const start = `@react.component\nlet make = (~className:string) =>  {\n`;
  const end = `\n}`;
  return (
    start +
    x
      .replace(";", "  ")
      .replace("{...props}", "  ")
      .replace(/strokeWidth=\{2}/g, `strokeWidth="2"`)
      .replace("width={20} height={20}", " className ")
      .replace("width={19} height={20}", " className ")
      .replace("width={24} height={24}", " className ") +
    end
  );
}

console.log("Building Rescript components...");

rimraf("./rescript/outline/*")
  .then(() => {
    return rimraf("./rescript/solid/*");
  })
  .then(() => {
    return Promise.all([
      fs.readdir("./src/solid").then((files) => {
        return Promise.all(
          files
            .filter((file) => file !== ".DS_Store")
            .map((file) => {
              const componentName = `${camelcase(file.replace(/\.svg$/, ""), {
                pascalCase: true,
              })}`;
              return fs
                .readFile(`./src/solid/${file}`, "utf8")
                .then((content) => {
                  return svgToRescript(content, `${componentName}Icon`);
                })
                .then((component) => {
                  const fileName = `${componentName}IconSolid.res`;
                  const content = replace_(component);
                  return fs
                    .writeFile(`./rescript/solid/${fileName}`, content)
                    .then(() => fileName);
                });
            })
        ).then((fileNames) => {
          // const exportStatements = fileNames
          //   .map((fileName) => {
          //     const componentName = `${camelcase(
          //       fileName.replace(/\.jsx$/, ""),
          //       {
          //         pascalCase: true,
          //       }
          //     )}`;
          //     return `export { default as ${componentName} } from './${fileName}'`;
          //   })
          //   .join("\n");
          // return fs.writeFile("./rescript/solid/index.js", exportStatements);
        });
      }),

      fs.readdir("./src/outline").then((files) => {
        return Promise.all(
          files
            .filter((file) => file !== ".DS_Store")
            .map((file) => {
              const componentName = `${camelcase(file.replace(/\.svg$/, ""), {
                pascalCase: true,
              })}`;
              return fs
                .readFile(`./src/outline/${file}`, "utf8")
                .then((content) => {
                  return svgToRescript(content, `${componentName}Icon`);
                })
                .then((component) => {
                  const fileName = `${componentName}IconOutline.res`;
                  const content = replace_(component);
                  return fs
                    .writeFile(`./rescript/outline/${fileName}`, content)
                    .then(() => fileName);
                });
            })
        ).then((fileNames) => {
          // const exportStatements = fileNames
          //   .map((fileName) => {
          //     const componentName = `${camelcase(
          //       fileName.replace(/\.res$/, ""),
          //       {
          //         pascalCase: true,
          //       }
          //     )}`;
          //     return `export { default as ${componentName} } from './${fileName}'`;
          //   })
          //   .join("\n");
          // return fs.writeFile("./rescript/outline/index.js", exportStatements);
        });
      }),
    ]);
  })
  .then(() => console.log("Finished building Rescript components."));
