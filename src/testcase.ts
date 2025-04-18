import { MetacriticService, RecordType } from './'

new MetacriticService().getDetail('The Last of Us part II', RecordType.Game).then((result) => {
  console.log(result)
})
