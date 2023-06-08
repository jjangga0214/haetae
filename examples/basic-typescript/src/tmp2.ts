console.log(await Promise.all([Promise.resolve(1), '2', Promise.resolve('3')]))
