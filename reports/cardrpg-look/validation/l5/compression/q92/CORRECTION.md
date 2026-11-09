# Rejected compression attempt

The original packing receipt's method string is incorrect: the glTF-Transform `webp` command decoded EXT_meshopt_compression. It preserved named scene nodes but did not preserve compressed geometry. It also retained source images when the new image was larger. All three outputs are larger; none was promoted. Original receipt/log/output remain retained. Next study starts from uncompressed source models and compresses geometry after texture encoding.
